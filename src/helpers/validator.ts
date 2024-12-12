import Validator from "validatorjs";
import { emailValidation, minutes, phoneValidation } from "@/helpers/helper";
import constants from "@/utils/constants";
import OTP from "@/models/otp";
import User from "@/models/user";
import Skill from "@/models/skill";
import Referral from "@/models/referral";

const validator = async (
  body: object,
  rules: any,
  customMessages: any,
  callback: any
) => {
  const validation = new Validator(body, rules, customMessages);
  validation.passes(() => callback(null, true));
  validation.fails(() => callback(validation.errors, false));
};

Validator.registerAsync(
  "verifyEmail",
  async function (value: any, attribute, req, passes) {
    if (await emailValidation(value)) {
      passes(false, constants.message.invalidEmail);
    } else {
      passes();
    }
  },
  ""
);

Validator.registerAsync(
  "verifyPhone",
  async function (value: any, attribute, req: any, passes) {
    if (!(await phoneValidation(attribute, value))) {
      passes(false, constants.message.invalidPhone);
    } else {
      passes();
    }
  },
  ""
);

Validator.register(
  "OTP",
  (value: any) => value.toString().length === 6,
  constants.message.otpLength
);

const regex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
Validator.register(
  "checkPassword",
  (value: any) => regex.test(value) === true,
  constants.message.invalidPassword
);

const usernameRegex = /^([a-z_])[a-z0-9_\.]{4,10}$/; // should start with underscore or lowercase letters and contains lowercase letters, numbers, dots and underscores
Validator.register(
  "verifyUsername",
  (value: any) => usernameRegex.test(value) === true,
  constants.message.invalidUsername
);

Validator.registerAsync(
  "verifyOTP",
  async function (value: any, attribute, req, passes) {
    const data = await OTP.findOne({
      "phone.value": attribute,
    });

    if (!data) {
      passes(false, constants.message.dataNotFound);
    } else if ((await minutes(data.updatedAt)) >= 5) {
      passes(false, constants.message.otpExpire);
    } else if (data.otp !== Number(value)) {
      passes(false, constants.message.invalidOTP);
    } else {
      OTP.findOneAndDelete({
        "phone.value": attribute,
      }).then(async (data) => {
        passes();
      });
    }
  },
  ""
);

const letterRegex = /^[A-Z]+$/i; // only letters
Validator.register(
  "checkString",
  (value: any) => letterRegex.test(value) === true,
  constants.message.invalidValue
);

const letterAndWhitespaceRegex = /^[A-Z\s]*$/i; // only letters with whitespaces
Validator.register(
  "checkStringTwo",
  (value: any) => letterAndWhitespaceRegex.test(value) === true,
  constants.message.invalidValue
);

const letterAndNumberRegex = /^[A-Za-z0-9]*$/; // only letter and numbers only
Validator.register(
  "checkStringThree",
  (value: any) => letterAndNumberRegex.test(value) === true,
  constants.message.invalidValue
);

const letterNumberAndWhitespaceRegex = /^[A-Za-z0-9\s]*$/; // only letters, numbers and whitespace
Validator.register(
  "checkStringFour",
  (value: any) => letterNumberAndWhitespaceRegex.test(value) === true,
  constants.message.invalidValue
);

const letterNumberWhitespaceAndSpecialCharacterRegex =
  /^[A-Za-z0-9\s\d&@#$.)(\'"/-_+|=:?^*]*$/; // only letters, numbers, whitespaces and special character '&,@,#,$'
Validator.register(
  "checkStringFive",
  (value: any) =>
    letterNumberWhitespaceAndSpecialCharacterRegex.test(value) === true,
  constants.message.invalidValue
);

const ISODateRegex =
  /^[0-9]{4}-((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01])|(0[469]|11)-(0[1-9]|[12][0-9]|30)|(02)-(0[1-9]|[12][0-9]))T(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]):(0[0-9]|[1-5][0-9])\.[0-9]{3}Z$/;
Validator.register(
  "checkISODateString",
  (value: any) => ISODateRegex.test(value) === true,
  constants.message.invalidISOstring
);

Validator.registerAsync(
  "checkAge",
  async function (value: any, attribute, req, passes) {
    const today: any = new Date();
    const birth: any = new Date(value);
    const years = new Date(today - birth).getFullYear() - 1970;
    if (years >= 18) {
      passes();
    } else {
      passes(false, constants.message.notOldEnough);
    }
  },
  ""
);

Validator.registerAsync(
  "checkEmail",
  async function (value: any, attribute, req, passes) {
    const emailExists = await User.exists({
      "email.value": value,
    });
    if (!emailExists) {
      passes();
    } else {
      passes(false, constants.message.emailTaken);
    }
  },
  ""
);

Validator.registerAsync(
  "checkPhone",
  async function (value: any, attribute, req, passes) {
    const phoneExists = await User.exists({ "phone.value": value });
    if (!phoneExists) {
      passes();
    } else {
      passes(false, constants.message.phoneTaken);
    }
  },
  ""
);

Validator.registerAsync(
  "checkUsername",
  async function (value: any, attribute, req, passes) {
    const usernameExists = await User.exists({ username: value });
    if (!usernameExists) {
      passes();
    } else {
      passes(false, constants.message.usernameTaken);
    }
  },
  ""
);

Validator.registerAsync(
  "validatePassword",
  async function (value: any, attribute, req, passes) {
    if (value === attribute) {
      passes();
    } else {
      passes(false, constants.message.passwordNotMatched);
    }
  },
  ""
);

Validator.registerAsync(
  "checkPrivileges",
  async function (value: any, attribute, req, passes) {
    const privileges: any = new Map([
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
    ]);

    const data: any = new Map(value);

    const compareMap = (privileges: any, data: any) => {
      for (const [key, value] of data) {
        if (!privileges.has(key)) {
          passes(false, `The selected privilege ${key} is invalid.`);
          return;
        } else {
          for (let i = 0; i < value.length; i++) {
            if (!privileges.get(key).includes(value[i])) {
              passes(
                false,
                `The selected right ${value[i]} is invalid in privilage ${key}.`
              );
              return;
            }
          }
        }
      }
      passes();
    };

    compareMap(privileges, data);
  },
  ""
);

Validator.registerAsync(
  "object",
  async function (value: any, attribute, req: string, passes) {
    if (typeof value === "object") {
      passes();
    } else {
      passes(false, `The ${req} must be a object.`);
    }
  },
  ""
);

Validator.registerAsync(
  "checkCurrentDateTime",
  async function (value: any, attribute, req: string, passes) {
    const date = new Date();
    if (value < date.toISOString()) {
      passes(false, `${req} should be greater than current time.`);
    } else {
      passes();
    }
  },
  ""
);

Validator.registerAsync(
  "checkAgeFourteen",
  async function (value: any, attribute, req, passes) {
    const today: any = new Date();
    const birth: any = new Date(value);
    const years = new Date(today - birth).getFullYear() - 1970;
    if (years >= 14) {
      passes();
    } else {
      passes(false, constants.message.notOldEnoughFourteen);
    }
  },
  ""
);

Validator.registerAsync(
  "checkArrayValueID",
  async function (value: any, attribute, req: string, passes) {
    if (!Array.isArray(value)) {
      passes(false, `The ${req} must be an array.`);
    } else if (!value.every((element: any) => element.length === 24)) {
      passes(false, `The ${req} must be 24 characters.`);
    } else {
      passes();
    }
  },
  ""
);

Validator.registerAsync(
  "checkSkillID",
  async function (value: any, attribute, req, passes) {
    const skillExists = await Skill.exists({
      _id: value,
      isDeleted: false,
    });
    if (!skillExists) {
      passes(false, constants.message.dataNotFound);
    } else {
      passes();
    }
  },
  ""
);

Validator.registerAsync(
  "checkReferralCode",
  async function (value: any, attribute, req, passes) {
    const referralExists = await Referral.exists({
      referralCode: value,
      isDeleted: false,
    });
    if (!referralExists) {
      passes(false, constants.message.invalidReferralCode);
    } else {
      passes();
    }
  },
  ""
);

export default validator;
