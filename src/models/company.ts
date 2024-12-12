import { Schema, model } from "mongoose";

const companySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    logo: {
      localUrl: {
        type: String,
        trim: true,
        default: null,
      },
      bucketUrl: {
        type: String,
        trim: true,
        default: null,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: null,
    },
    registrationNumber: {
      value: {
        type: String,
        unique: true,
        trim: true,
      },
      isVerified: { type: Boolean, default: false },
    },
    pan: {
      value: {
        type: String,
        unique: true,
        trim: true,
      },
      isVerified: { type: Boolean, default: false },
    },
    gst: {
      value: {
        type: String,
        unique: true,
        trim: true,
      },
      isVerified: { type: Boolean, default: false },
    },
    address: {
      lineOne: { type: String, trim: true, default: null },
      lineTwo: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, default: null },
      country: {
        type: String,
        trim: true,
        default: null,
      },
      pincode: { type: String, trim: true, default: null },
    },
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

const Company = model("Company", companySchema);

export default Company;
