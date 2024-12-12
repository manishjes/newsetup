import { Schema, model } from "mongoose";

const referralSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (value: string) => value && value.toUpperCase(),
    },
    referred: [
      {
        userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      },
    ],
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

const Referral = model("Referral", referralSchema);

export default Referral;
