import { Schema, model } from "mongoose";

const countrySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    capital: {
      type: String,
      required: true,
      trim: true,
    },
    isoCode: {
      type: String,
      required: true,
      trim: true,
    },
    dialCode: {
      type: String,
      required: true,
      trim: true,
    },
    flag: {
      symbol: {
        type: String,
        required: true,
        trim: true,
      },
      icon: {
        type: String,
        required: true,
        trim: true,
      },
    },
    continent: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      code: {
        type: String,
        required: true,
        trim: true,
      },
      symbol: {
        type: String,
        required: true,
        trim: true,
      },
    },
    timeZone: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      format: {
        type: String,
        required: true,
        trim: true,
      },
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

const Country = model("Country", countrySchema);

export default Country;
