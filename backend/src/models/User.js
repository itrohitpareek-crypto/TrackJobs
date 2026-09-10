import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      default: "",
      trim: true,
    },

    institution: {
      type: String,
      default: "",
      trim: true,
    },

    fieldOfStudy: {
      type: String,
      default: "",
      trim: true,
    },

    startYear: {
      type: String,
      default: "",
      trim: true,
    },

    endYear: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      default: "",
      trim: true,
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    current: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false,
    },

    googleId: {
      type: String,
      default: undefined,
      sparse: true,
      unique: true,
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    passwordResetToken: {
      type: String,
      default: "",
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
    },

    avatar: {
      type: String,
      default: "",
    },

    // Cloudinary public ID for profile picture
    avatarPublicId: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    industry: {
      type: String,
      default: "",
      trim: true,
    },

    companySize: {
      type: String,
      enum: [
        "",
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1001-5000",
        "5001-10000",
        "10000+",
      ],
      default: "",
    },

    companyWebsite: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    headline: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    resumeUrl: {
      type: String,
      default: "",
    },

    resumeOriginalName: {
      type: String,
      default: "",
    },

    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },

    githubUrl: {
      type: String,
      default: "",
      trim: true,
    },

    portfolioUrl: {
      type: String,
      default: "",
      trim: true,
    },

    preferredRole: {
      type: String,
      default: "",
      trim: true,
    },

    preferredLocation: {
      type: String,
      default: "",
      trim: true,
    },

    workModePreference: {
      type: String,
      enum: ["", "On-site", "Hybrid", "Remote"],
      default: "",
    },

    expectedSalaryMin: {
      type: Number,
      default: 0,
      min: 0,
    },

    expectedSalaryMax: {
      type: Number,
      default: 0,
      min: 0,
    },

    noticePeriod: {
      type: String,
      default: "",
      trim: true,
    },

    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    notificationPreferences: {
      applicationUpdates: {
        type: Boolean,
        default: true,
      },

      messages: {
        type: Boolean,
        default: true,
      },

      jobAlerts: {
        type: Boolean,
        default: true,
      },

      marketingEmails: {
        type: Boolean,
        default: false,
      },
    },

    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },

      allowRecruiterMessages: {
        type: Boolean,
        default: true,
      },
    },

    accountStatus: {
      type: String,
      enum: ["active", "deactivated", "deleted"],
      default: "active",
      index: true,
    },

    deactivatedAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);