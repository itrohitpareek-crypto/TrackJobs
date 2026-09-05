import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Interview Scheduled",
        "Interviewed",
        "Selected",
        "Rejected",
        "Withdrawn",
      ],
      default: "Applied",
    },

    coverLetter: {
      type: String,
      default: "",
      trim: true,
    },

    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    recruiterNotes: {
      type: String,
      default: "",
    },

    interview: {
      date: {
        type: Date,
        default: null,
      },

      mode: {
        type: String,
        default: "",
      },

      notes: {
        type: String,
        default: "",
      },
    },

    withdrawnAt: {
      type: Date,
      default: null,
    },

    withdrawnReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index(
  {
    job: 1,
    candidate: 1,
  },
  {
    unique: true,
  }
);

applicationSchema.index({
  candidate: 1,
  status: 1,
});

applicationSchema.index({
  job: 1,
  status: 1,
});

export default mongoose.model(
  "Application",
  applicationSchema
);