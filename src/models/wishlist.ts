import { Schema, model } from "mongoose";

const itemSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [itemSchema],
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

const Wishlist = model("Wishlist", wishlistSchema);

export default Wishlist;
