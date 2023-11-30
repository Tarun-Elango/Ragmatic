import mongoose, { Schema } from "mongoose";

const answerSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    answers: [answerSchema],
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export default Message;
