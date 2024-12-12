import { Schema, model } from "mongoose";

const deviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    deviceToken: { type: String, trim: true },
    deviceId: {
      //the device ID is a unique, anonymized string of numbers and letters that identifies every individual smartphone or tablet in the world
      type: String,
      required: true,
      trim: true,
    },
    appId: {
      //the app id, usually something like com.moodle.moodlemobile
      type: String,
      required: true,
      trim: true,
    },
    name: {
      //the device name, occam or iPhone etc..
      type: String,
      required: true,
      trim: true,
    },
    model: {
      //the device model, Nexus 4 or iPad 1,1
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      //the device platform, Android or iOS etc
      type: String,
      required: true,
      trim: true,
    },
    version: {
      //The device version, 6.1.2, 4.2.2 etc..
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
      trim: true,
    },
    longitude: {
      type: Number,
      required: true,
      trim: true,
    },
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
        delete ret.__v;
      },
    },
  }
);

const Device = model("Device", deviceSchema);

export default Device;
