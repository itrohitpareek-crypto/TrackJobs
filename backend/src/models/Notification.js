import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "application",
        "status",
        "interview",
        "job",
        "system",
        "message",
      ],
      default: "system",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    link: {
      type: String,
      default: "",
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    eventKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  recipient: 1,
  read: 1,
  createdAt: -1,
});

export default mongoose.model(
  "Notification",
  notificationSchema
);