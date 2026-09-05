import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
      ],
      default: "Full-time",
    },

    workMode: {
      type: String,
      enum: [
        "On-site",
        "Hybrid",
        "Remote",
      ],
      default: "On-site",
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    industry: {
      type: String,
      default: "",
      trim: true,
    },

    employmentLevel: {
      type: String,
      enum: [
        "Internship",
        "Entry level",
        "Associate",
        "Mid-Senior level",
        "Director",
        "Executive",
      ],
      default: "Mid-Senior level",
    },

    openings: {
      type: Number,
      default: 1,
      min: 1,
    },

    education: {
      type: String,
      default: "",
      trim: true,
    },

    noticePeriod: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "0-2 years",
      trim: true,
    },

    experienceMin: {
      type: Number,
      default: 0,
      min: 0,
    },

    experienceMax: {
      type: Number,
      default: 2,
      min: 0,
    },

    salary: {
      type: String,
      default: "Competitive",
      trim: true,
    },

    salaryMin: {
      type: Number,
      default: 0,
      min: 0,
    },

    salaryMax: {
      type: Number,
      default: 0,
      min: 0,
    },

    salaryCurrency: {
      type: String,
      default: "INR",
    },

    skills: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    requirements: {
      type: [String],
      default: [],
    },

    responsibilities: {
      type: [String],
      default: [],
    },

    niceToHave: {
      type: [String],
      default: [],
    },

    benefits: {
      type: [String],
      default: [],
    },

    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "closed",
      ],
      default: "active",
    },

    deadline: {
      type: Date,
      default: null,
    },

    applicationLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    externalApplyUrl: {
      type: String,
      default: "",
      trim: true,
    },

    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },

    companyWebsite: {
      type: String,
      default: "",
      trim: true,
    },

    applicationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

jobSchema.index({
  title: "text",
  company: "text",
  location: "text",
  skills: "text",
});

jobSchema.index({
  recruiter: 1,
  status: 1,
});

jobSchema.index({
  deadline: 1,
});

// ==========================================
// MODEL EXPORT
// ==========================================

export default mongoose.model(
  "Job",
  jobSchema
);