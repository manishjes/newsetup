import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (value: string) => value && value.toUpperCase(),
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    subscriptionDate: { type: Date, required: true, default: Date.now },
    renewalDate: {
      type: Date,
      required: true,
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
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
