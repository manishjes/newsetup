import constants from "@/utils/constants";
import { Schema, model } from "mongoose";

const faqSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => value && value.toLowerCase(),
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
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

const FAQ = model("FAQ", faqSchema);

export default FAQ;
