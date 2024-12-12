import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => value && value.toUpperCase(),
    }, // Order Number generated from system.
    orderId: { type: String /*required: true*/ }, // Payment Gateway Order ID.
    paymentId: { type: String /* required: true */ }, // Payment Gateway Payment ID
    paymentMode: {
      type: Number,
      required: true,
      enum: [constants.paymentMode.prepaid, constants.paymentMode.postpaid],
    },
    currency: {
      type: String,
      required: true,
    },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true }, // Payment Gateway's payment method.
    paymentDate: { type: Date /*required: true*/ }, // Payment Gateway's payment date.
    status: {
      type: Number,
      required: true,
      enum: [
        constants.paymentStatus.pending,
        constants.paymentStatus.paid,
        constants.paymentStatus.failed,
      ],
      default: constants.paymentStatus.pending,
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
        ret.paymentDate =
          ret.paymentDate && new Date(ret.paymentDate).getTime();
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

const Payment = model("Payment", paymentSchema);

export default Payment;
