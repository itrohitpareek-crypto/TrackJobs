import path from "path";

import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import {
  createNotificationWithEmail,
} from "../utils/notificationService.js";

const allowedStatuses = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Interviewed",
  "Selected",
  "Rejected",
  "Withdrawn",
];

const calculateMatchScore = (
  candidateSkills = [],
  jobSkills = []
) => {
  if (
    !jobSkills.length ||
    !candidateSkills.length
  ) {
    return 0;
  }

  const candidateSet =
    new Set(
      candidateSkills.map(
        (skill) =>
          skill.toLowerCase().trim()
      )
    );

  const matched =
    jobSkills.filter((skill) =>
      candidateSet.has(
        skill.toLowerCase().trim()
      )
    );

  return Math.round(
    (matched.length /
      jobSkills.length) *
      100
  );
};


// ==========================================
// APPLY TO JOB
// ==========================================

export const apply = async (
  req,
  res
) => {
  try {
    const { jobId } =
      req.params;

    const {
      coverLetter = "",
    } = req.body;

    if (
      req.user.role !==
      "candidate"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only candidates can apply for jobs",
      });
    }

    const job =
      await Job.findById(
        jobId
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          "Job not found",
      });
    }

    if (
      job.status !==
      "active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Applications are closed for this job",
      });
    }

    if (
      job.deadline &&
      new Date(job.deadline) <
        new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application deadline has passed",
      });
    }

    if (
      job.applicationLimit >
        0 &&
      job.applicationsCount >=
        job.applicationLimit
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application limit has been reached",
      });
    }

    const existing =
      await Application.findOne({
        job: jobId,
        candidate:
          req.user._id,
      });

    if (existing) {
      if (
        existing.status ===
        "Withdrawn"
      ) {
        existing.status =
          "Applied";

        existing.withdrawnAt =
          null;

        existing.withdrawnReason =
          "";

        existing.coverLetter =
          String(
            coverLetter
          ).trim();

        await existing.save();

        return res.status(200).json({
          success: true,
          message:
            "Application submitted again",
          application:
            existing,
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "You have already applied for this job",
      });
    }

    const candidate =
      await User.findById(
        req.user._id
      );

    const matchScore =
      calculateMatchScore(
        candidate?.skills || [],
        job.skills || []
      );

    const application =
      await Application.create({
        job: jobId,
        candidate:
          req.user._id,
        coverLetter:
          String(
            coverLetter
          ).trim(),
        matchScore,
        status: "Applied",
      });

    await Job.findByIdAndUpdate(
      jobId,
      {
        $inc: {
          applicationsCount: 1,
        },
      }
    );

    // Recruiter gets:
    // 1. In-app notification
    // 2. Email notification
    //
    // Message/chat emails are NOT used here.

    await createNotificationWithEmail({
      recipient:
        job.recruiter,

      type: "application",

      title:
        "New job application",

      message: `${
        candidate?.name ||
        "A candidate"
      } applied for ${
        job.title ||
        "your job"
      }.`,

      link:
        "/recruiter",

      relatedId:
        application._id,

      eventKey:
        `application:${application._id}:created`,

      preference:
        "applicationUpdates",
    });

    const populated =
      await Application.findById(
        application._id
      )
        .populate(
          "job",
          "title company location salary type workMode deadline"
        )
        .populate(
          "candidate",
          "name email phone location skills resumeUrl avatar"
        );

    return res.status(201).json({
      success: true,
      message:
        "Application submitted successfully",
      application:
        populated,
    });
  } catch (error) {
    console.error(
      "Apply Error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You have already applied for this job",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to submit application",
    });
  }
};


// ==========================================
// CANDIDATE APPLICATIONS
// ==========================================

export const myApplications =
  async (req, res) => {
    try {
      const applications =
        await Application.find({
          candidate:
            req.user._id,
        })
          .populate(
            "job",
            "title company location salary salaryMin salaryMax type workMode skills deadline status"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error(
        "My Applications Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch applications",
      });
    }
  };


// ==========================================
// SINGLE APPLICATION
// ==========================================

export const getMyApplication =
  async (req, res) => {
    try {
      const application =
        await Application.findOne({
          _id: req.params.id,
          candidate:
            req.user._id,
        })
          .populate(
            "job",
            "title company location salary salaryMin salaryMax type workMode skills description deadline status"
          )
          .populate(
            "candidate",
            "name email phone location skills resumeUrl avatar linkedinUrl githubUrl portfolioUrl"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      return res.status(200).json({
        success: true,
        application,
      });
    } catch (error) {
      console.error(
        "Get Application Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch application",
      });
    }
  };


// ==========================================
// WITHDRAW APPLICATION
// ==========================================

export const withdrawApplication =
  async (req, res) => {
    try {
      const application =
        await Application.findOne({
          _id: req.params.id,
          candidate:
            req.user._id,
        });

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      if (
        [
          "Selected",
          "Rejected",
          "Withdrawn",
        ].includes(
          application.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Application cannot be withdrawn because it is already ${application.status}`,
        });
      }

      application.status =
        "Withdrawn";

      application.withdrawnAt =
        new Date();

      application.withdrawnReason =
        String(
          req.body?.reason ||
            "Candidate withdrew the application"
        ).trim();

      await application.save();

      await Job.findByIdAndUpdate(
        application.job,
        {
          $inc: {
            applicationsCount:
              -1,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Application withdrawn successfully",
        application,
      });
    } catch (error) {
      console.error(
        "Withdraw Application Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to withdraw application",
      });
    }
  };


// ==========================================
// RECRUITER APPLICANTS
// ==========================================

export const applicants =
  async (req, res) => {
    try {
      const job =
        await Job.findOne({
          _id: req.params.jobId,
          recruiter:
            req.user._id,
        });

      if (!job) {
        return res.status(404).json({
          success: false,
          message:
            "Job not found or unauthorized",
        });
      }

      const applications =
        await Application.find({
          job:
            req.params.jobId,
        })
          .populate(
            "candidate",
            "name email phone location bio headline skills education experience resumeUrl avatar linkedinUrl githubUrl portfolioUrl"
          )
          .populate(
            "job",
            "title company location salary type workMode"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error(
        "Applicants Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch applicants",
      });
    }
  };


// ==========================================
// RECRUITER APPLICATION
// ==========================================

export const getRecruiterApplication =
  async (req, res) => {
    try {
      const application =
        await Application.findById(
          req.params.id
        )
          .populate(
            "candidate",
            "name email phone location bio headline skills education experience resumeUrl avatar linkedinUrl githubUrl portfolioUrl preferredRole preferredLocation workModePreference expectedSalaryMin expectedSalaryMax noticePeriod profileVisibility"
          )
          .populate(
            "job",
            "title company location salary salaryMin salaryMax type workMode recruiter"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      if (
        !application.job ||
        String(
          application.job.recruiter
        ) !==
          String(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this application",
        });
      }

      return res.status(200).json({
        success: true,
        application,
      });
    } catch (error) {
      console.error(
        "Get Recruiter Application Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch application",
      });
    }
  };


// ==========================================
// UPDATE APPLICATION STATUS
// ==========================================

export const updateStatus =
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application status",
        });
      }

      if (
        status === "Withdrawn"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recruiters cannot set an application to Withdrawn",
        });
      }

      const application =
        await Application.findById(
          req.params.id
        )
          .populate(
            "job",
            "recruiter title company"
          )
          .populate(
            "candidate",
            "name email notificationPreferences"
          );

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      if (
        String(
          application.job.recruiter
        ) !==
        String(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update this application",
        });
      }

      const previousStatus =
        application.status;

      const previousInterviewDate =
        application.interview?.date
          ? new Date(
              application.interview.date
            ).getTime()
          : null;

      const previousInterviewMode =
        String(
          application.interview
            ?.mode || ""
        );

      application.status =
        status;

      if (
        req.body.interview
      ) {
        application.interview =
          {
            date:
              req.body.interview
                .date || null,

            mode:
              String(
                req.body.interview
                  .mode || ""
              ),

            notes:
              String(
                req.body.interview
                  .notes || ""
              ),
          };
      }

      const nextInterviewDate =
        application.interview?.date
          ? new Date(
              application.interview.date
            ).getTime()
          : null;

      const nextInterviewMode =
        String(
          application.interview
            ?.mode || ""
        );

      const statusChanged =
        previousStatus !==
        status;

      const interviewChanged =
        previousInterviewDate !==
          nextInterviewDate ||
        previousInterviewMode !==
          nextInterviewMode;

      await application.save();

      // =================================================
      // EMAIL + NOTIFICATION
      // =================================================

      if (
        statusChanged ||
        interviewChanged
      ) {
        let title =
          `Application status updated: ${status}`;

        let message =
          `Your application for ${
            application.job?.title ||
            "the job"
          } is now ${status}.`;

        // Interview scheduled/rescheduled
        if (
          status ===
            "Interview Scheduled" &&
          nextInterviewDate
        ) {
          const when =
            new Date(
              nextInterviewDate
            ).toLocaleString(
              "en-IN",
              {
                dateStyle:
                  "medium",
                timeStyle:
                  "short",
              }
            );

          title =
            previousInterviewDate
              ? "Interview rescheduled"
              : "Interview scheduled";

          message =
            `Your interview for ${
              application.job?.title ||
              "the job"
            } is ${
              previousInterviewDate
                ? "rescheduled"
                : "scheduled"
            } for ${when}${
              nextInterviewMode
                ? ` (${nextInterviewMode})`
                : ""
            }.`;
        }

        // Interview cancelled
        else if (
          previousInterviewDate &&
          !nextInterviewDate
        ) {
          title =
            "Interview cancelled";

          message =
            `The interview for ${
              application.job?.title ||
              "the job"
            } has been cancelled by the recruiter. Your application remains ${status}.`;
        }

        await createNotificationWithEmail(
          {
            recipient:
              application
                .candidate
                ?._id,

            type:
              status ===
              "Interview Scheduled"
                ? "interview"
                : "application",

            title,

            message,

            link:
              "/applications",

            relatedId:
              application._id,

            eventKey:
              status ===
                "Interview Scheduled" &&
              nextInterviewDate
                ? `application:${application._id}:interview:${nextInterviewDate}`
                : `application:${application._id}:status:${status}:${Date.now()}`,

            preference:
              "applicationUpdates",
          }
        );
      }

      const updated =
        await Application.findById(
          application._id
        )
          .populate(
            "candidate",
            "name email phone location skills education experience resumeUrl avatar linkedinUrl githubUrl portfolioUrl"
          )
          .populate(
            "job",
            "title company location salary type workMode"
          );

      return res.status(200).json({
        success: true,
        message:
          "Application status updated successfully",
        application:
          updated,
      });
    } catch (error) {
      console.error(
        "Update Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update application status",
      });
    }
  };


// ==========================================
// RECRUITER DASHBOARD
// ==========================================

export const dashboard =
  async (req, res) => {
    try {
      const jobs =
        await Job.countDocuments({
          recruiter:
            req.user._id,
          status: "active",
        });

      const recruiterJobs =
        await Job.find({
          recruiter:
            req.user._id,
        }).select("_id");

      const jobIds =
        recruiterJobs.map(
          (job) => job._id
        );

      const applications =
        await Application.countDocuments(
          {
            job: {
              $in: jobIds,
            },
          }
        );

      const selected =
        await Application.countDocuments(
          {
            job: {
              $in: jobIds,
            },
            status: "Selected",
          }
        );

      const shortlisted =
        await Application.countDocuments(
          {
            job: {
              $in: jobIds,
            },
            status:
              "Shortlisted",
          }
        );

      return res.status(200).json({
        jobs,
        applications,
        selected,
        shortlisted,
      });
    } catch (error) {
      console.error(
        "Application Dashboard Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load dashboard",
      });
    }
  };


// ==========================================
// DOWNLOAD CANDIDATE RESUME
// ==========================================

export const downloadCandidateResume =
  async (req, res) => {
    try {
      const application =
        await Application.findById(
          req.params.id
        ).populate("job");

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      if (
        String(
          application.job.recruiter
        ) !==
          String(req.user._id) &&
        req.user.role !==
          "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }

      const candidate =
        await User.findById(
          application.candidate
        );

      if (
        !candidate ||
        !candidate.resumeUrl
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate resume not available",
        });
      }

      const filename =
        path.basename(
          candidate.resumeUrl
        );

      const filePath =
        path.join(
          process.cwd(),
          "uploads",
          filename
        );

      const extension =
        path.extname(
          filename
        );

      const safeName =
        String(
          candidate.name ||
            "Candidate"
        ).replace(
          /[^a-zA-Z0-9]/g,
          "-"
        );

      return res.download(
        filePath,
        `${safeName}-Resume${extension}`,
        (error) => {
          if (error) {
            console.error(
              "Resume download error:",
              error
            );

            if (
              !res.headersSent
            ) {
              res.status(404).json({
                success: false,
                message:
                  "Resume file not found",
              });
            }
          }
        }
      );
    } catch (error) {
      console.error(
        "Resume download error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to download resume",
      });
    }
  };