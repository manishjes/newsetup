import constants from "@/utils/constants";
import { Schema, model } from "mongoose";

const feebackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    type: {
      type: String,
      required: true,
      enum: [
        constants.feedbackTypes.account,
        constants.feedbackTypes.application,
        constants.feedbackTypes.quiz,
      ],
    },
    reason: { type: String, trim: true },
    description: { type: String, trim: true },
    rating: { type: Number },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        ret.createdAt = ret.createdAt && new Date(ret.createdAt).getTime();
        ret.updatedAt = ret.updatedAt && new Date(ret.updatedAt).getTime();
        delete ret._id;
        delete ret.__v;
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
      },
    },
  }
);

const Feedback = model("Feedback", feebackSchema);

export default Feedback;
