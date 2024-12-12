import { Request, Response, NextFunction } from "express";
import validator from "@/helpers/validator";
import constants from "@/utils/constants";
import { createError, getMessage, validateRequestData } from "@/helpers/helper";

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      first_name: "required|string|min:3|max:20|checkString",
      middle_name: "string|min:3|max:20|checkString",
      last_name: "required|string|min:3|max:20|checkString",
      email: "required|string|email|checkEmail",
      iso_code: "required|string",
      phone: `required|string|verifyPhone:${req.body.iso_code}|checkPhone`,
      username: "required|string|verifyUsername|checkUsername",
      date_of_birth: "required|string|checkISODateString|checkAgeFourteen",
      user_acceptance: "required|boolean|in:true,false",
      referral_code: "string|checkReferralCode",
      interests: "required|array|checkArrayValueID",
    };

    const msg = {
      "array.interests": "The interests must be an array.",
    };

    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      iso_code: "required|string",
      phone: `required|string|verifyPhone:${req.body.iso_code}`,
      otp: `required|numeric|OTP|verifyOTP:${req.body.phone}`,
      device_info: {
        device_token: "string",
        device_id: "required|string",
        app_id: "required|string",
        name: "required|string",
        model: "required|string",
        platform: "required|string",
        version: "required|string",
        ip: "required|string",
        latitude: "required",
        longitude: "required",
      },
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};


const googlelogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      credential: "required",
      device_info: {
        device_token: "string",
        device_id: "required|string",
        app_id: "required|string",
        name: "required|string",
        model: "required|string",
        platform: "required|string",
        version: "required|string",
        ip: "required|string",
        latitude: "required",
        longitude: "required",
      },
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const changePicture = async (req: any, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      picture: "required|string",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const updateDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      first_name: "string|min:3|max:20|checkString",
      middle_name: "string|min:3|max:20|checkString",
      last_name: "string|min:3|max:20|checkString",
      gender: `string|in:${constants.gender.male},${constants.gender.female},${constants.gender.other}`,
      date_of_birth: "string|checkISODateString|checkAgeFourteen",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      email: "required|string|email",
      otp: "required|numeric|OTP",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const verifyPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      iso_code: "required|string",
      phone: `required|string|verifyPhone:${req.body.iso_code}`,
      otp: "required|numeric|OTP",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const updateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      email: "required|string|email|checkEmail",
      otp: "required|numeric|OTP",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const updatePhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationRule = {
      iso_code: "required|string",
      phone: `required|string|verifyPhone:${req.body.iso_code}|checkPhone`,
      otp: "required|numeric|OTP",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const manageAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      is_2FA: "required|boolean|in:true,false",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const manageNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      is_notification: "required|boolean|in:true,false",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const deactivateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      status: "required|boolean|in:true,false",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationRule = {
      is_delete: "required|boolean|in:true,false",
    };
    const msg = {};
    await validator(
      req.body,
      validationRule,
      msg,
      async (err: object, status: boolean) => {
        if (!status) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              await getMessage(err)
            )
          );
        } else if (!(await validateRequestData(validationRule, req.body))) {
          return next(
            await createError(
              constants.code.expectationFailed,
              constants.message.unwantedData
            )
          );
        } else {
          next();
        }
      }
    );
  } catch (err) {
    next(err);
  }
};

export default {
  register,
  login,
  googlelogin,
  changePicture,
  updateDetail,
  verifyEmail,
  verifyPhone,
  updateEmail,
  updatePhone,
  manageAuthentication,
  manageNotification,
  deactivateAccount,
  deleteAccount,
};
