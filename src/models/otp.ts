import { Schema, model } from "mongoose";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => value.toLowerCase(),
    },
    phone: {
      isoCode: {
        type: String,
        required: true,
        trim: true,
        set: (value: string) => value.toUpperCase(),
      },
      value: {
        type: String,
        required: true,
      },
    },
    otp: {
      type: Number,
      required: true,
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
        ret.createdAt = ret.createdAt && new Date(ret.createdAt).getTime();
        ret.updatedAt = ret.updatedAt && new Date(ret.updatedAt).getTime();
        delete ret._id;
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
      },
    },
  }
);

const OTP = model("OTP", otpSchema);

export default OTP;
