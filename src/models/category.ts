import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const categorySchema = new Schema(
  {
    image: {
      localUrl: {
        type: String,
        trim: true,
      },
      bucketUrl: {
        type: String,
        trim: true,
      },
    },
    name: {
      required: true,
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => value.toLowerCase(),
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: [
        constants.catalougeTypes.product,
        constants.catalougeTypes.skill,
        constants.catalougeTypes.faq,
      ],
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

const Category = model("Category", categorySchema);

export default Category;
