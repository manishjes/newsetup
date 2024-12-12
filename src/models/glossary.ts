import { Schema, model } from "mongoose";

const glossarySchema = new Schema(
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
      set: (value: string) => value && value.toLowerCase(),
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    longdescription: {
      type: String,
      required: true,
      trim: true,
    },
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
        delete ret.isDeleted;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret._id;
        delete ret.__v;
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
      },
    },
  }
);

const Glossary = model("Glossary", glossarySchema);

export default Glossary;
