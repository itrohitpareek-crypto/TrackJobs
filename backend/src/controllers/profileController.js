import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import multer from "multer";

import User from "../models/User.js";

// ==========================================
// UPLOAD DIRECTORY + MULTER CONFIG
// (avatar image + resume file)
// ==========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-");

    cb(null, `${Date.now()}-${baseName}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const resumeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (
    file.fieldname === "avatar" &&
    imageTypes.includes(file.mimetype)
  ) {
    return cb(null, true);
  }

  if (
    file.fieldname === "resume" &&
    resumeTypes.includes(file.mimetype)
  ) {
    return cb(null, true);
  }

  cb(new Error("Unsupported file type"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const cleanString = (
  value,
  maxLength = 1000
) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .slice(0, maxLength);
};

const cleanArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      String(item).trim()
    )
    .filter(Boolean)
    .slice(0, 50);
};

const validateUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return [
      "http:",
      "https:",
    ].includes(url.protocol);
  } catch {
    return false;
  }
};


// ==========================================
// GET PROFILE
// ==========================================

export const getProfile = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile: user,
    });

  } catch (error) {

    console.error(
      "Get Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};


// ==========================================
// UPDATE PROFILE
// ==========================================

export const updateProfile = async (
  req,
  res
) => {
  try {

    const allowedFields = [
      "name",
      "company",
      "industry",
      "companySize",
      "companyWebsite",
      "phone",
      "location",
      "bio",
      "headline",
      "skills",
      "education",
      "experience",
      "linkedinUrl",
      "githubUrl",
      "portfolioUrl",
      "preferredRole",
      "preferredLocation",
      "workModePreference",
      "expectedSalaryMin",
      "expectedSalaryMax",
      "noticePeriod",
      "profileVisibility",
    ];

    const updates = {};

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        updates[field] =
          req.body[field];
      }
    }


    // ======================================
    // MULTIPART ARRAY PARSING
    // ======================================

    for (
      const field of [
        "skills",
        "education",
        "experience",
      ]
    ) {

      if (
        typeof updates[field] ===
        "string"
      ) {
        try {

          updates[field] =
            JSON.parse(
              updates[field]
            );

        } catch {

          updates[field] = [];
        }
      }
    }


    // ======================================
    // BASIC PROFILE FIELDS
    // ======================================

    if (
      updates.name !==
      undefined
    ) {

      updates.name =
        cleanString(
          updates.name,
          100
        );

      if (
        updates.name.length <
        2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must contain at least 2 characters",
        });
      }
    }


    if (
      updates.company !==
      undefined
    ) {
      updates.company =
        cleanString(
          updates.company,
          200
        );
    }


    if (
      updates.industry !==
      undefined
    ) {
      updates.industry =
        cleanString(
          updates.industry,
          150
        );
    }


    // ======================================
    // COMPANY SIZE
    // ======================================

    if (
      updates.companySize !==
      undefined
    ) {

      const allowedCompanySizes = [
        "",
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1001-5000",
        "5001-10000",
        "10000+",
      ];

      updates.companySize =
        cleanString(
          updates.companySize,
          20
        );

      if (
        !allowedCompanySizes.includes(
          updates.companySize
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid company size",
        });
      }
    }


    // ======================================
    // COMPANY WEBSITE
    // ======================================

    if (
      updates.companyWebsite !==
      undefined
    ) {

      updates.companyWebsite =
        cleanString(
          updates.companyWebsite,
          500
        );

      if (
        !validateUrl(
          updates.companyWebsite
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "companyWebsite must be a valid URL",
        });
      }
    }


    if (
      updates.phone !==
      undefined
    ) {
      updates.phone =
        cleanString(
          updates.phone,
          20
        );
    }


    if (
      updates.location !==
      undefined
    ) {
      updates.location =
        cleanString(
          updates.location,
          150
        );
    }


    if (
      updates.headline !==
      undefined
    ) {
      updates.headline =
        cleanString(
          updates.headline,
          150
        );
    }


    if (
      updates.bio !==
      undefined
    ) {
      updates.bio =
        cleanString(
          updates.bio,
          1500
        );
    }


    // ======================================
    // SKILLS
    // ======================================

    if (
      updates.skills !==
      undefined
    ) {
      updates.skills =
        cleanArray(
          updates.skills
        );
    }


    // ======================================
    // EDUCATION
    // ======================================

    if (
      updates.education !==
      undefined
    ) {

      if (
        !Array.isArray(
          updates.education
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Education must be an array",
        });
      }

      updates.education =
        updates.education
          .slice(0, 10)
          .map((item) => ({
            degree:
              cleanString(
                item.degree,
                150
              ),

            institution:
              cleanString(
                item.institution,
                200
              ),

            fieldOfStudy:
              cleanString(
                item.fieldOfStudy,
                150
              ),

            startYear:
              cleanString(
                item.startYear,
                10
              ),

            endYear:
              cleanString(
                item.endYear,
                10
              ),

            description:
              cleanString(
                item.description,
                500
              ),
          }));
    }


    // ======================================
    // EXPERIENCE
    // ======================================

    if (
      updates.experience !==
      undefined
    ) {

      if (
        !Array.isArray(
          updates.experience
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Experience must be an array",
        });
      }

      updates.experience =
        updates.experience
          .slice(0, 10)
          .map((item) => ({
            jobTitle:
              cleanString(
                item.jobTitle,
                150
              ),

            company:
              cleanString(
                item.company,
                200
              ),

            location:
              cleanString(
                item.location,
                150
              ),

            startDate:
              item.startDate ||
              null,

            endDate:
              item.current
                ? null
                : item.endDate ||
                  null,

            current:
              Boolean(
                item.current
              ),

            description:
              cleanString(
                item.description,
                1000
              ),
          }));
    }


    // ======================================
    // URL FIELDS
    // ======================================

    const urlFields = [
      "linkedinUrl",
      "githubUrl",
      "portfolioUrl",
    ];

    for (
      const field of urlFields
    ) {

      if (
        updates[field] !==
        undefined
      ) {

        updates[field] =
          cleanString(
            updates[field],
            500
          );

        if (
          !validateUrl(
            updates[field]
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${field} must be a valid URL`,
          });
        }
      }
    }


    // ======================================
    // SALARY
    // ======================================

    if (
      updates.expectedSalaryMin !==
      undefined
    ) {
      updates.expectedSalaryMin =
        Number(
          updates.expectedSalaryMin
        ) || 0;
    }


    if (
      updates.expectedSalaryMax !==
      undefined
    ) {
      updates.expectedSalaryMax =
        Number(
          updates.expectedSalaryMax
        ) || 0;
    }


    if (
      updates.expectedSalaryMin >
        0 &&
      updates.expectedSalaryMax >
        0 &&
      updates.expectedSalaryMax <
        updates.expectedSalaryMin
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum expected salary cannot be lower than minimum salary",
      });
    }


    // ======================================
    // UPLOADED FILES
    // ======================================

    if (
      req.files?.avatar?.[0]
    ) {
      updates.avatar =
        `/uploads/${req.files.avatar[0].filename}`;
    }


    if (
      req.files?.resume?.[0]
    ) {
      updates.resumeUrl =
        `/uploads/${req.files.resume[0].filename}`;
    }


    // ======================================
    // SAVE PROFILE
    // ======================================

    const user =
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      profile: user,
    });

  } catch (error) {

    console.error(
      "Update Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile",
      error: error.message,
    });
  }
};