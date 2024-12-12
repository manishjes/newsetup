import constants from "@/utils/constants";
import { Schema, model } from "mongoose";

const planSchema = new Schema(
  {
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
    description: {
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    type: {
      type: String,
      required: true,
      enum: [
        constants.planType.trial,
        constants.planType.basic,
        constants.planType.standard,
      ],
      default: constants.planType.trial,
    },
    price: {
      currency: {
        code: {
          type: String,
          trim: true,
          required: true,
          set: (value: string) => value && value.toUpperCase(),
        },
        symbol: {
          type: String,
          trim: true,
          required: true,
        },
      },
      value: {
        type: Number,
        required: true,
      },
    },
    recurringCycle: {
      type: String,
      required: true,
      enum: [
        constants.recurringCycle.daily,
        constants.recurringCycle.biweekly,
        constants.recurringCycle.weekly,
        constants.recurringCycle.monthly,
        constants.recurringCycle.quarterly,
        constants.recurringCycle.annually,
      ],
    },
    status: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
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
        delete ret.isDeleted;
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Plan = model("Plan", planSchema);

export default Plan;
