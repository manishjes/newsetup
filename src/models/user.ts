import { Schema, model } from "mongoose";
import constants from "@/utils/constants";
import { getUserName, hashPassword } from "@/helpers/helper";

const userSchema = new Schema(
  {
    photo: {
      localUrl: {
        type: String,
        trim: true,
      },
      bucketUrl: {
        type: String,
        trim: true,
      },
    },
    name: {
      firstName: {
        type: String,
        trim: true,
        required: true,
        set: (value: string) =>
          value && value.charAt(0).toUpperCase() + value.slice(1),
      },
      middleName: {
        type: String,
        trim: true,
        set: (value: string) =>
          value && value.charAt(0).toUpperCase() + value.slice(1),
      },
      lastName: {
        type: String,
        trim: true,
        required: true,
        set: (value: string) =>
          value && value.charAt(0).toUpperCase() + value.slice(1),
      },
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      set: (value: string) => value && value.toLowerCase(),
    },
    email: {
      value: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value && value.toLowerCase(),
      },
      isVerified: { type: Boolean, required: true, default: false },
    },
    phone: {
      isoCode: {
        type: String,
        required: true,
        trim: true,
        set: (value: string) => value && value.toUpperCase(),
        default: "IN",
      },
      value: {
        type: String,
        required: true,
        unique: true,
      },
      isVerified: { type: Boolean, required: true, default: false },
    },
    gender: {
      type: String,
      enum: [
        constants.gender.male,
        constants.gender.female,
        constants.gender.other,
      ],
    },
    dob: {
      type: Date,
    },
    role: {
      type: Number,
      required: true,
      enum: [
        constants.accountLevel.superAdmin,
        constants.accountLevel.admin,
        constants.accountLevel.user,
      ],
      default: constants.accountLevel.user,
    },
    privileges: {
      type: Map,
      of: Array,
    },
    is2FA: {
      type: Boolean,
      required: true,
      default: false,
    },
    isPremium: {
      type: Boolean,
      required: true,
      default: false,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    password: {
      value: { type: String, required: true },
      createdOn: { type: Date, required: true, default: Date.now },
    },
    registrationType: {
      type: String,
      required: true,
      enum: [
        constants.registrationType.normal,
        constants.registrationType.google,
        constants.registrationType.facebook,
      ],
      default: constants.registrationType.normal,
    },
    notification: {
      pushNotification: { type: Boolean, required: true, default: true },
      emailNotification: { type: Boolean, required: true, default: true },
      messageNotification: { type: Boolean, required: true, default: true },
    },
    acceptance: {
      terms: {
        isAccepted: { type: Boolean, required: true, default: false },
        acceptedOn: { type: Date, required: true, default: Date.now },
      },
      privacy: {
        isAccepted: { type: Boolean, required: true, default: false },
        acceptedOn: { type: Date, required: true, default: Date.now },
      },
    },
    userVerificationToken: { type: String },
    status: { type: Boolean, required: true, default: true },
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
        ret.dob = ret.dob && new Date(ret.dob).getTime();
        ret.createdAt = ret.createdAt && new Date(ret.createdAt).getTime();
        ret.updatedAt = ret.updatedAt && new Date(ret.updatedAt).getTime();
        delete ret.password;
        delete ret.registrationType;
        delete ret.acceptance;
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

userSchema.method("getAuthDetail", async function getAuthDetail() {
  return {
    email: this.email?.value,
    isoCode: this.phone?.isoCode,
    phone: this.phone?.value,
    role: this.role,
    is_2FA: this.is2FA,
    privileges: this.privileges,
  };
});

const User = model("User", userSchema);

User.find().then(async (data) => {
  if (!data.length) {
    User.create({
      name: {
        firstName: process.env.SUPER_ADMIN_FIRST_NAME,
        lastName: process.env.SUPER_ADMIN_LAST_NAME,
      },
      username: await getUserName(process.env.SUPER_ADMIN_EMAIL),
      email: {
        value: process.env.SUPER_ADMIN_EMAIL,
      },
      phone: {
        value: process.env.SUPER_ADMIN_PHONE,
      },
      password: {
        value: await hashPassword(process.env.SUPER_ADMIN_PASSWORD),
      },
      role: constants.accountLevel.superAdmin,
      privileges: [
        [
          constants.privileges.settingManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.userManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.templateManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.pageManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.addressManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.feedbackManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.brandManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.glossaryManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.categoryManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.skillManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.questionManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.quizManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.productManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.orderManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.shipmentManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.reviewManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.faqManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.planManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
        [
          constants.privileges.subscriptionManagement,
          [
            constants.rights.read,
            constants.rights.write,
            constants.rights.delete,
          ],
        ],
      ],
    });
  }
});

export default User;
