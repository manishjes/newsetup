import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const productSchema = new Schema(
  {
    images: [
      {
        localUrl: {
          type: String,
          trim: true,
        },
        bucketUrl: {
          type: String,
          trim: true,
        },
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      set: (value: string) => value && value.toLowerCase(),
    },
    description: {
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    SKU: {
      required: true,
      type: String,
      trim: true,
      set: (value: string) => value && value.toUpperCase(),
    },
    HSN: {
      type: String,
      trim: true,
      required: true,
    },
    manufacturedDate: {
      type: Date,
      required: true,
    },
    weight: {
      unit: {
        type: String,
        required: true,
        enum: [
          constants.massUnit.mg,
          constants.massUnit.g,
          constants.massUnit.kg,
        ],
        default: constants.massUnit.kg,
      },
      value: { type: Number, required: true },
    },
    measurement: {
      length: {
        unit: {
          type: String,
          required: true,
          enum: [
            constants.measureUnit.mm,
            constants.measureUnit.cm,
            constants.measureUnit.m,
          ],
          default: constants.measureUnit.cm,
        },
        value: { type: Number, required: true },
      },
      breadth: {
        unit: {
          type: String,
          required: true,
          enum: [
            constants.measureUnit.mm,
            constants.measureUnit.cm,
            constants.measureUnit.m,
          ],
          default: constants.measureUnit.cm,
        },
        value: { type: Number, required: true },
      },
      height: {
        unit: {
          type: String,
          required: true,
          enum: [
            constants.measureUnit.mm,
            constants.measureUnit.cm,
            constants.measureUnit.m,
          ],
          default: constants.measureUnit.cm,
        },
        value: { type: Number, required: true },
      },
    },
    origin: {
      type: String,
      trim: true,
      required: true,
    },
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
    tax: {
      type: {
        type: String,
        trim: true,
        required: true,
        enum: [constants.taxTypes.GST, constants.taxTypes.VAT],
        default: constants.taxTypes.GST,
      },
      value: {
        type: Number,
        required: true,
      },
    },
    mrp: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    taxIncluded: {
      type: Boolean,
      required: true,
      default: true,
    },
    additionalCharge: {
      shipping: { type: Number },
      packaging: { type: Number },
    },
    specification: {
      type: Array,
    },
    quantity: { type: Number, required: true },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    returnPeriod: { type: Number, required: true, default: 0 },
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

const Product = model("Product", productSchema);

export default Product;
