import constants from "@/utils/constants";
import { Schema, model } from "mongoose";

const questionSchema = new Schema(
  {
    title: {
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
      set: (value: string) => value.toLowerCase(),
    },
    description: {
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    type: {
      type: String,
      trim: true,
      required: true,
      enum: [
        constants.questionTypes.shortAnswer,
        constants.questionTypes.checkBox,
        constants.questionTypes.dropdown,
        constants.questionTypes.multipleChoice,
      ],
      default: constants.questionTypes.shortAnswer,
    },
    level: {
      type: String,
      trim: true,
      required: true,
      enum: [
        constants.levels.easy,
        constants.levels.medium,
        constants.levels.hard,
        constants.levels.expert,
        constants.levels.master,
        constants.levels.extreme,
      ],
    },
    option: {
      isShuffle: {
        type: Boolean,
        default: false,
      },
      options: [
        {
          value: {
            type: String,
            trim: true,
            set: (value: string) =>
              value && value.charAt(0).toUpperCase() + value.slice(1),
          },
        },
      ],
    },
    answer: {
      answers: [
        {
          value: {
            type: String,
            trim: true,
            set: (value: string) =>
              value && value.charAt(0).toUpperCase() + value.slice(1),
          },
        },
      ],
      description: {
        type: String,
        trim: true,
        set: (value: string) =>
          value && value.charAt(0).toUpperCase() + value.slice(1),
      },
    },
    hint: {
      type: String,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    points: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    survey: {
      type: Boolean,
      required: true,
      default: false,
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

const Question = model("Question", questionSchema);

export default Question;
