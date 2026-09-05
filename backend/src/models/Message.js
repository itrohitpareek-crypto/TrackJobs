import mongoose from "mongoose";


const messageSchema =
  new mongoose.Schema(
    {
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job"
      },

      application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application"
      },

      text: {
        type: String,
        required: true,
        trim: true
      },

      read: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );


messageSchema.index({
  from: 1,
  to: 1,
  createdAt: -1
});


export default mongoose.model(
  "Message",
  messageSchema
);