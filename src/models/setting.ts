import { Schema, model } from "mongoose";
import constants from "@/utils/constants";

const settingSchema = new Schema(
  {
    application: {
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
      organization: {
        name: {
          type: String,
          trim: true,
          default: null,
        },
        CIN: {
          type: String,
          trim: true,
          default: null,
          set: (value: string) => value && value.toUpperCase(),
        },
        GST: {
          type: String,
          trim: true,
          default: null,
          set: (value: string) => value && value.toUpperCase(),
        },
        PAN: {
          type: String,
          trim: true,
          default: null,
          set: (value: string) => value && value.toUpperCase(),
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
      country: {
        name: {
          type: String,
          trim: true,
          default: null,
        },
        code: {
          type: String,
          trim: true,
          default: null,
        },
      },
      timezone: {
        name: {
          type: String,
          trim: true,
          default: null,
        },
        format: {
          type: String,
          trim: true,
          default: null,
        },
      },
      language: {
        name: {
          type: String,
          trim: true,
          default: null,
        },
        code: {
          type: String,
          trim: true,
          default: null,
        },
      },
      currency: {
        code: {
          type: String,
          trim: true,
          default: null,
        },
        symbol: {
          type: String,
          trim: true,
          default: null,
        },
      },
      dateFormat: {
        type: String,
        required: true,
        enum: [
          constants.dateFormat.dayMonthYear,
          constants.dateFormat.monthDayYear,
          constants.dateFormat.yearMonthDay,
        ],
        default: constants.dateFormat.dayMonthYear,
      },
      timeFormat: {
        type: String,
        required: true,
        enum: [
          constants.timeFormat.twelveHour,
          constants.timeFormat.twentyFourHour,
        ],
        default: constants.timeFormat.twelveHour,
      },
      weekStartsOn: {
        type: String,
        required: true,
        enum: [
          constants.weekDay.sunday,
          constants.weekDay.monday,
          constants.weekDay.tuesday,
          constants.weekDay.wednesday,
          constants.weekDay.thursday,
          constants.weekDay.friday,
          constants.weekDay.saturday,
        ],
        default: constants.weekDay.monday,
      },
      socialLinks: {
        twitter: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
        facebook: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/en/0/04/Facebook_f_logo_%282021%29.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
        instagram: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
        youtube: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
        linkedin: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
        github: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/commons/a/ae/Github-desktop-logo-symbol.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
        pinterest: {
          logoUrl: {
            type: String,
            trim: true,
            default:
              "https://upload.wikimedia.org/wikipedia/commons/4/4d/Pinterest.svg",
          },
          link: {
            type: String,
            trim: true,
            default: null,
          },
        },
      },
    },
    accessKey: {
      type: String,
      required: true,
      trim: true,
    },
    maintenance: {
      status: { type: Boolean, required: true, default: false },
      time: { type: Date },
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
        // ret.id = ret._id;
        ret.createdAt = ret.createdAt && new Date(ret.createdAt).getTime();
        ret.updatedAt = ret.updatedAt && new Date(ret.updatedAt).getTime();
        // ret.maintenance.time =
        //   ret.maintenance.time && new Date(ret.maintenance.time).getTime();
        delete ret.isDeleted;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// For reference

// settingSchema.set("toJSON", {
//   transform: (doc, ret, options) => {
//     ret.id = ret._id;
//     delete ret._id;
//     delete ret._v;
//   },
// });

// settingSchema.method("getSetting", async function getSetting() {
//   return {
//     application: this.application,
//     createdAt: await unixTime(this.createdAt),
//     updatedAt: await unixTime(this.updatedAt),
//   };
// });

const Setting = model("Setting", settingSchema);

Setting.find().then((data) => {
  if (!data.length) {
    Setting.create({
      "application.name": process.env.APP_NAME,
      accessKey: process.env.ACCESS_KEY,
    });
  }
});

export default Setting;
