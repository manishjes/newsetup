import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const itemSchema = new Schema({
  sellerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Product",
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
  quantity: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
  discount: { type: Number, required: true, default: 0 },
  discountPercent: { type: Number, required: true, default: 0 },
  taxableAmount: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  subTotal: { type: Number, required: true, default: 0 },
  additionalCharge: {
    shipping: { type: Number },
    packaging: { type: Number },
  },
  coupanDiscount: {
    code: {
      type: String,
      trim: true,
      set: (value: string) => value && value.toUpperCase(),
    },
    discount: {
      type: Number,
    },
  },
  netAmount: { type: Number, required: true, default: 0 },
  status: [
    {
      value: {
        type: Number,
        required: true,
        enum: [constants.orderStatus.open],
        default: constants.orderStatus.open,
      },
      updatedOn: { type: Date, required: true, default: Date.now },
    },
  ],
});

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },
    billingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
    },
    items: [itemSchema],
    total: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    discountPercent: { type: Number, required: true, default: 0 },
    taxableAmount: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    subTotal: { type: Number, required: true, default: 0 },
    additionalCharge: {
      shipping: { type: Number },
      packaging: { type: Number },
    },
    coupanDiscount: {
      code: {
        type: String,
        trim: true,
        set: (value: string) => value && value.toUpperCase(),
      },
      discount: {
        type: Number,
      },
    },
    netAmount: { type: Number, required: true, default: 0 },
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
    status: {
      type: Number,
      required: true,
      enum: [
        constants.cartStatus.open,
        constants.cartStatus.inReview,
        constants.cartStatus.fulfilled,
      ],
      default: constants.cartStatus.open,
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

const Cart = model("Cart", cartSchema);

export default Cart;
