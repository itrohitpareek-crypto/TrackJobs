import Job from "../models/Job.js";
import User from "../models/User.js";

// ==========================================
// HELPERS
// ==========================================

const cleanString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const cleanArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean);
};

const toNumber = (value, fallback = 0) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const buildExperienceText = (
  min,
  max
) => {
  if (min === max) {
    return `${min} years`;
  }

  return `${min}-${max} years`;
};

// ==========================================
// GET ALL JOBS
// ==========================================

export const listJobs = async (
  req,
  res
) => {
  try {
    const {
      q = "",
      location = "",
      type = "",
      workMode = "",
      skills = "",
      experienceMin = "",
      experienceMax = "",
      salaryMin = "",
      salaryMax = "",
      page = 1,
      limit = 9,
    } = req.query;

    const currentPage = Math.max(
      Number(page) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(Number(limit) || 9, 1),
      50
    );

    // Only active jobs should appear
    // publicly. Old jobs without status
    // are also supported.
    const filter = {
      $or: [
        {
          status: "active",
        },
        {
          status: {
            $exists: false,
          },
        },
      ],
    };

    // --------------------------------------
    // SEARCH
    // --------------------------------------

    const searchText = cleanString(q);

    if (searchText) {
      filter.$and = [
        {
          $or: [
            {
              title: {
                $regex:
                  escapeRegex(searchText),
                $options: "i",
              },
            },
            {
              company: {
                $regex:
                  escapeRegex(searchText),
                $options: "i",
              },
            },
            {
              description: {
                $regex:
                  escapeRegex(searchText),
                $options: "i",
              },
            },
            {
              skills: {
                $regex:
                  escapeRegex(searchText),
                $options: "i",
              },
            },
            {
              department: {
                $regex:
                  escapeRegex(searchText),
                $options: "i",
              },
            },
            {
              industry: {
                $regex:
                  escapeRegex(searchText),
                $options: "i",
              },
            },
          ],
        },
      ];
    }

    // --------------------------------------
    // LOCATION
    // --------------------------------------

    const locationText =
      cleanString(location);

    if (locationText) {
      filter.location = {
        $regex:
          escapeRegex(locationText),
        $options: "i",
      };
    }

    // --------------------------------------
    // JOB TYPE
    // --------------------------------------

    const jobType = cleanString(type);

    if (jobType) {
      filter.type = jobType;
    }

    // --------------------------------------
    // WORK MODE
    // --------------------------------------

    const mode = cleanString(workMode);

    if (mode) {
      filter.workMode = mode;
    }

    // --------------------------------------
    // SKILLS
    // --------------------------------------

    const skillsText = cleanString(skills);

    if (skillsText) {
      const skillList = skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      if (skillList.length) {
        filter.skills = {
          $in: skillList.map(
            (skill) =>
              new RegExp(
                escapeRegex(skill),
                "i"
              )
          ),
        };
      }
    }

    // --------------------------------------
    // EXPERIENCE RANGE
    // --------------------------------------

    const minExp = Number(
      experienceMin
    );

    const maxExp = Number(
      experienceMax
    );

    if (
      experienceMin !== "" &&
      !Number.isNaN(minExp)
    ) {
      filter.experienceMax = {
        $gte: minExp,
      };
    }

    if (
      experienceMax !== "" &&
      !Number.isNaN(maxExp)
    ) {
      filter.experienceMin = {
        $lte: maxExp,
      };
    }

    // --------------------------------------
    // SALARY RANGE
    // --------------------------------------

    const minSalary = Number(
      salaryMin
    );

    const maxSalary = Number(
      salaryMax
    );

    if (
      salaryMin !== "" &&
      !Number.isNaN(minSalary)
    ) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            {
              salaryMax: {
                $gte: minSalary,
              },
            },
            {
              salaryMax: {
                $exists: false,
              },
            },
            {
              salaryMax: 0,
            },
          ],
        },
      ];
    }

    if (
      salaryMax !== "" &&
      !Number.isNaN(maxSalary)
    ) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            {
              salaryMin: {
                $lte: maxSalary,
              },
            },
            {
              salaryMin: {
                $exists: false,
              },
            },
            {
              salaryMin: 0,
            },
          ],
        },
      ];
    }

    // --------------------------------------
    // PAGINATION
    // --------------------------------------

    const skip =
      (currentPage - 1) * perPage;

    // --------------------------------------
    // GET JOBS
    // --------------------------------------

    const [
      jobs,
      total,
    ] = await Promise.all([
      Job.find(filter)
        .populate(
          "recruiter",
          "name email company avatar"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(perPage),

      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      jobs,
      total,
      page: currentPage,
      pages: Math.ceil(
        total / perPage
      ),
    });
  } catch (error) {
    console.error(
      "List Jobs Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch jobs",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE JOB
// LinkedIn / Naukri style validation
// ==========================================

export const createJob = async (
  req,
  res
) => {
  try {
    const body = req.body || {};

    // --------------------------------------
    // BASIC INFORMATION
    // --------------------------------------

    const title = cleanString(
      body.title
    );

    const company = cleanString(
      body.company ||
        req.user?.company
    );

    const location = cleanString(
      body.location
    );

    const description = cleanString(
      body.description
    );

    // --------------------------------------
    // ARRAYS
    // --------------------------------------

    const skills = cleanArray(
      body.skills
    );

    const responsibilities =
      cleanArray(
        body.responsibilities
      );

    const requirements =
      cleanArray(
        body.requirements
      );

    const niceToHave =
      cleanArray(
        body.niceToHave
      );

    const benefits =
      cleanArray(
        body.benefits
      );

    // --------------------------------------
    // REQUIRED VALIDATIONS
    // --------------------------------------

    if (!title) {
      return res.status(400).json({
        success: false,
        message:
          "Job title is required.",
      });
    }

    if (title.length < 3) {
      return res.status(400).json({
        success: false,
        message:
          "Job title must be at least 3 characters.",
      });
    }

    if (!company) {
      return res.status(400).json({
        success: false,
        message:
          "Company name is required.",
      });
    }

    if (!location) {
      return res.status(400).json({
        success: false,
        message:
          "Job location is required.",
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message:
          "Job description is required.",
      });
    }

    if (description.length < 30) {
      return res.status(400).json({
        success: false,
        message:
          "Job description should be at least 30 characters.",
      });
    }

    if (!skills.length) {
      return res.status(400).json({
        success: false,
        message:
          "Add at least one required skill.",
      });
    }

    if (!responsibilities.length) {
      return res.status(400).json({
        success: false,
        message:
          "Add at least one responsibility.",
      });
    }

    if (!requirements.length) {
      return res.status(400).json({
        success: false,
        message:
          "Add at least one qualification or requirement.",
      });
    }

    // --------------------------------------
    // NUMERIC VALUES
    // --------------------------------------

    const salaryMin = toNumber(
      body.salaryMin,
      0
    );

    const salaryMax = toNumber(
      body.salaryMax,
      0
    );

    const experienceMin =
      toNumber(
        body.experienceMin,
        0
      );

    const experienceMax =
      toNumber(
        body.experienceMax,
        0
      );

    const openings = toNumber(
      body.openings,
      1
    );

    const applicationLimit =
      toNumber(
        body.applicationLimit,
        0
      );

    // --------------------------------------
    // SALARY VALIDATION
    // --------------------------------------

    if (
      salaryMin < 0 ||
      salaryMax < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Salary cannot be negative.",
      });
    }

    if (
      salaryMax > 0 &&
      salaryMax < salaryMin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum salary cannot be lower than minimum salary.",
      });
    }

    // --------------------------------------
    // EXPERIENCE VALIDATION
    // --------------------------------------

    if (
      experienceMin < 0 ||
      experienceMax < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Experience cannot be negative.",
      });
    }

    if (
      experienceMax <
      experienceMin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum experience cannot be lower than minimum experience.",
      });
    }

    // --------------------------------------
    // OPENINGS VALIDATION
    // --------------------------------------

    if (
      !Number.isInteger(openings) ||
      openings < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Number of openings must be at least 1.",
      });
    }

    // --------------------------------------
    // APPLICATION LIMIT
    // 0 = unlimited
    // --------------------------------------

    if (
      !Number.isInteger(
        applicationLimit
      ) ||
      applicationLimit < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application limit must be 0 or a positive number.",
      });
    }

    // --------------------------------------
    // DEADLINE
    // --------------------------------------

    let deadline = null;

    if (body.deadline) {
      deadline = new Date(
        body.deadline
      );

      if (
        Number.isNaN(
          deadline.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application deadline.",
        });
      }

      // End of selected day
      deadline.setHours(
        23,
        59,
        59,
        999
      );

      if (deadline < new Date()) {
        return res.status(400).json({
          success: false,
          message:
            "Application deadline must be in the future.",
        });
      }
    }

    // --------------------------------------
    // URL VALUES
    // --------------------------------------

    const externalApplyUrl =
      cleanString(
        body.externalApplyUrl
      );

    const linkedinUrl =
      cleanString(
        body.linkedinUrl
      );

    const companyWebsite =
      cleanString(
        body.companyWebsite
      );

    // --------------------------------------
    // EXPERIENCE DISPLAY
    // --------------------------------------

    const experience =
      cleanString(
        body.experience
      ) ||
      buildExperienceText(
        experienceMin,
        experienceMax
      );

    // --------------------------------------
    // SALARY DISPLAY
    // --------------------------------------

    const salary =
      cleanString(
        body.salary
      ) ||
      (
        salaryMin > 0
          ? salaryMax > 0
            ? `₹${salaryMin} - ₹${salaryMax} per year`
            : `₹${salaryMin}+ per year`
          : "Competitive"
      );

    // --------------------------------------
    // STATUS
    // --------------------------------------

    const status =
      body.status === "draft"
        ? "draft"
        : "active";

    // --------------------------------------
    // JOB DATA
    // --------------------------------------

    const jobData = {
      title,
      company,
      location,

      type:
        body.type ||
        "Full-time",

      workMode:
        body.workMode ||
        "On-site",

      department:
        cleanString(
          body.department
        ),

      industry:
        cleanString(
          body.industry
        ),

      employmentLevel:
        body.employmentLevel ||
        "Mid-Senior level",

      openings,

      education:
        cleanString(
          body.education
        ),

      noticePeriod:
        cleanString(
          body.noticePeriod
        ),

      experience,

      experienceMin,

      experienceMax,

      salary,

      salaryMin,

      salaryMax,

      salaryCurrency:
        "INR",

      skills,

      description,

      responsibilities,

      requirements,

      niceToHave,

      benefits,

      recruiter:
        req.user._id,

      status,

      deadline,

      applicationLimit,

      externalApplyUrl,

      linkedinUrl,

      companyWebsite,

      applicationsCount: 0,
    };

    // --------------------------------------
    // CREATE
    // --------------------------------------

    const job =
      await Job.create(
        jobData
      );

    // --------------------------------------
    // POPULATE RECRUITER
    // --------------------------------------

    const populatedJob =
      await Job.findById(
        job._id
      ).populate(
        "recruiter",
        "name email company avatar"
      );

    return res.status(201).json({
      success: true,
      message:
        status === "draft"
          ? "Job saved as draft successfully"
          : "Job posted successfully",
      job: populatedJob,
    });
  } catch (error) {
    console.error(
      "Create Job Error:",
      error
    );

    // Mongoose validation error
    if (
      error.name ===
      "ValidationError"
    ) {
      const validationMessages =
        Object.values(
          error.errors || {}
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        success: false,
        message:
          validationMessages[0] ||
          "Invalid job details.",
        errors:
          validationMessages,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create job",
      error: error.message,
    });
  }
};

// ==========================================
// GET RECRUITER JOBS
// ==========================================

export const myJobs = async (
  req,
  res
) => {
  try {
    const jobs =
      await Job.find({
        recruiter: req.user._id,
      })
        .populate(
          "recruiter",
          "name email company avatar"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      jobs
    );
  } catch (error) {
    console.error(
      "My Jobs Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch your jobs",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE JOB
// ==========================================

export const getJob = async (
  req,
  res
) => {
  try {
    const job =
      await Job.findById(
        req.params.id
      ).populate(
        "recruiter",
        "name email company avatar"
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job not found",
      });
    }

    return res.status(200).json(
      job
    );
  } catch (error) {
    console.error(
      "Get Job Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch job",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE JOB
// ==========================================

export const updateJob = async (
  req,
  res
) => {
  try {
    const body = req.body || {};

    const updateData = {
      ...body,
    };

    // --------------------------------------
    // CLEAN ARRAY FIELDS
    // --------------------------------------

    if (
      body.skills !== undefined
    ) {
      updateData.skills =
        cleanArray(
          body.skills
        );
    }

    if (
      body.requirements !==
      undefined
    ) {
      updateData.requirements =
        cleanArray(
          body.requirements
        );
    }

    if (
      body.responsibilities !==
      undefined
    ) {
      updateData.responsibilities =
        cleanArray(
          body.responsibilities
        );
    }

    if (
      body.niceToHave !==
      undefined
    ) {
      updateData.niceToHave =
        cleanArray(
          body.niceToHave
        );
    }

    if (
      body.benefits !==
      undefined
    ) {
      updateData.benefits =
        cleanArray(
          body.benefits
        );
    }

    // --------------------------------------
    // CLEAN STRING FIELDS
    // --------------------------------------

    const stringFields = [
      "title",
      "company",
      "location",
      "department",
      "industry",
      "education",
      "noticePeriod",
      "experience",
      "salary",
      "description",
      "externalApplyUrl",
      "linkedinUrl",
      "companyWebsite",
    ];

    stringFields.forEach(
      (field) => {
        if (
          body[field] !==
          undefined
        ) {
          updateData[field] =
            cleanString(
              body[field]
            );
        }
      }
    );

    // --------------------------------------
    // NUMERIC FIELDS
    // --------------------------------------

    const numericFields = [
      "salaryMin",
      "salaryMax",
      "experienceMin",
      "experienceMax",
      "openings",
      "applicationLimit",
    ];

    numericFields.forEach(
      (field) => {
        if (
          body[field] !==
          undefined
        ) {
          updateData[field] =
            toNumber(
              body[field],
              0
            );
        }
      }
    );

    // --------------------------------------
    // VALIDATE SALARY
    // --------------------------------------

    if (
      updateData.salaryMin !==
        undefined &&
      updateData.salaryMin < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum salary cannot be negative.",
      });
    }

    if (
      updateData.salaryMax !==
        undefined &&
      updateData.salaryMax < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum salary cannot be negative.",
      });
    }

    if (
      updateData.salaryMin !==
        undefined &&
      updateData.salaryMax !==
        undefined &&
      updateData.salaryMax > 0 &&
      updateData.salaryMax <
        updateData.salaryMin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum salary cannot be lower than minimum salary.",
      });
    }

    // --------------------------------------
    // VALIDATE EXPERIENCE
    // --------------------------------------

    if (
      updateData.experienceMin !==
        undefined &&
      updateData.experienceMin < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum experience cannot be negative.",
      });
    }

    if (
      updateData.experienceMax !==
        undefined &&
      updateData.experienceMax < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum experience cannot be negative.",
      });
    }

    if (
      updateData.experienceMin !==
        undefined &&
      updateData.experienceMax !==
        undefined &&
      updateData.experienceMax <
        updateData.experienceMin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum experience cannot be lower than minimum experience.",
      });
    }

    // --------------------------------------
    // OPENINGS
    // --------------------------------------

    if (
      updateData.openings !==
        undefined &&
      (
        !Number.isInteger(
          updateData.openings
        ) ||
        updateData.openings < 1
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Number of openings must be at least 1.",
      });
    }

    // --------------------------------------
    // APPLICATION LIMIT
    // --------------------------------------

    if (
      updateData.applicationLimit !==
        undefined &&
      (
        !Number.isInteger(
          updateData.applicationLimit
        ) ||
        updateData.applicationLimit < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application limit must be 0 or a positive number.",
      });
    }

    // --------------------------------------
    // DEADLINE
    // --------------------------------------

    if (
      body.deadline !==
      undefined
    ) {
      if (!body.deadline) {
        updateData.deadline = null;
      } else {
        const deadline =
          new Date(
            body.deadline
          );

        if (
          Number.isNaN(
            deadline.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid application deadline.",
          });
        }

        deadline.setHours(
          23,
          59,
          59,
          999
        );

        if (
          deadline < new Date()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Application deadline must be in the future.",
          });
        }

        updateData.deadline =
          deadline;
      }
    }

    // --------------------------------------
    // UPDATE
    // --------------------------------------

    const job =
      await Job.findOneAndUpdate(
        {
          _id: req.params.id,
          recruiter: req.user._id,
        },

        updateData,

        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "recruiter",
        "name email company avatar"
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error(
      "Update Job Error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      const validationMessages =
        Object.values(
          error.errors || {}
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        success: false,
        message:
          validationMessages[0] ||
          "Invalid job details.",
        errors:
          validationMessages,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to update job",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE JOB
// ==========================================

export const deleteJob = async (
  req,
  res
) => {
  try {
    const job =
      await Job.findOneAndDelete({
        _id: req.params.id,
        recruiter: req.user._id,
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Job deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Job Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete job",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE JOB STATUS
// ==========================================

export const updateJobStatus =
  async (
    req,
    res
  ) => {
    try {
      const {
        status,
      } = req.body;

      if (
        ![
          "active",
          "closed",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid job status",
        });
      }

      const job =
        await Job.findOneAndUpdate(
          {
            _id: req.params.id,
            recruiter:
              req.user._id,
          },

          {
            status,
          },

          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "recruiter",
          "name email company avatar"
        );

      if (!job) {
        return res.status(404).json({
          success: false,
          message:
            "Job not found or unauthorized",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          `Job ${
            status === "active"
              ? "activated"
              : "closed"
          } successfully`,
        job,
      });
    } catch (error) {
      console.error(
        "Update Job Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update job status",
        error: error.message,
      });
    }
  };

// ==========================================
// SAVE JOB
// ==========================================

export const saveJob = async (
  req,
  res
) => {
  try {
    const job =
      await Job.findById(
        req.params.id
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job not found",
      });
    }

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    if (!user.savedJobs) {
      user.savedJobs = [];
    }

    const alreadySaved =
      user.savedJobs.some(
        (jobId) =>
          jobId.toString() ===
          req.params.id
      );

    if (alreadySaved) {
      return res.status(200).json({
        success: true,
        saved: true,
        message:
          "Job is already saved",
      });
    }

    user.savedJobs.push(
      job._id
    );

    await user.save();

    return res.status(200).json({
      success: true,
      saved: true,
      message:
        "Job saved successfully",
    });
  } catch (error) {
    console.error(
      "Save Job Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save job",
      error: error.message,
    });
  }
};

// ==========================================
// UNSAVE JOB
// ==========================================

export const unsaveJob =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      user.savedJobs =
        (
          user.savedJobs || []
        ).filter(
          (jobId) =>
            jobId.toString() !==
            req.params.id
        );

      await user.save();

      return res.status(200).json({
        success: true,
        saved: false,
        message:
          "Job removed from saved jobs",
      });
    } catch (error) {
      console.error(
        "Unsave Job Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to remove saved job",
        error: error.message,
      });
    }
  };

// ==========================================
// GET SAVED JOBS
// ==========================================

export const savedJobs =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await User.findById(
          req.user._id
        ).populate({
          path: "savedJobs",

          populate: {
            path: "recruiter",
            select:
              "name email company avatar",
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        jobs:
          user.savedJobs || [],
      });
    } catch (error) {
      console.error(
        "Saved Jobs Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch saved jobs",
        error: error.message,
      });
    }
  };