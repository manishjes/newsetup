import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { emailQueue } from "@/helpers/queue/queue";
import constants from "@/utils/constants";
import {
  checkPassword,
  createError,
  getFileName,
  hashPassword,
  minutes,
  photoURL,
  randomString,
  removePhoto,
} from "@/helpers/helper";
import {
  createToken,
  createTokenMobile,
  deleteAllToken,
  deleteToken,
} from "@/helpers/token";
import User from "@/models/user";
import Device from "@/models/device";
import OTP from "@/models/otp";

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = await User.findOne({
      "email.value": req.body.email,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidEmail
        )
      );
    } else if (!(await checkPassword(req.body.password, data.password.value))) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidPassword
        )
      );
    } else if (!data.status) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.userInactive
        )
      );
    } else if (data.isDeleted) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.userDeleted
        )
      );
    } else if (
      data.role !== constants.accountLevel.superAdmin &&
      data.role !== constants.accountLevel.admin
    ) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidUser
        )
      );
    } else {
      const deviceInfo = await Device.findOneAndUpdate(
        { userId: data._id, deviceId: req.body.device_info.device_id },
        {
          userId: data._id,
          deviceToken: req.body.device_info.device_token,
          deviceId: req.body.device_info.device_id,
          appId: req.body.device_info.app_id,
          name: req.body.device_info.name,
          model: req.body.device_info.model,
          platform: req.body.device_info.platform,
          version: req.body.device_info.version,
          ipAddress: req.body.device_info.ip,
          latitude: req.body.device_info.latitude,
          longitude: req.body.device_info.longitude,
          createdBy: data._id,
        },
        { new: true, upsert: true }
      );

      if (deviceInfo) {
        const payload = {
          id: data._id,
        };

        return await responseHandler(req, res, constants.message.success, {
          token:
            req.body.device_info.platform !== constants.deviceTypes.android &&
            req.body.device_info.platform !== constants.deviceTypes.iOS
              ? await createToken(payload)
              : await createTokenMobile(payload),
          data: await data.getAuthDetail(),
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const loginWithOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: any = await User.findOne({
      "phone.value": req.body.phone,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidPhone
        )
      );
    } else if (!data.status) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.userInactive
        )
      );
    } else if (data.isDeleted) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.userDeleted
        )
      );
    } else if (
      data.role !== constants.accountLevel.superAdmin &&
      data.role !== constants.accountLevel.admin
    ) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidUser
        )
      );
    } else {
      const deviceInfo = await Device.findOneAndUpdate(
        { userId: data._id, deviceId: req.body.device_info.device_id },
        {
          userId: data._id,
          deviceToken: req.body.device_info.device_token,
          deviceId: req.body.device_info.device_id,
          appId: req.body.device_info.app_id,
          name: req.body.device_info.name,
          model: req.body.device_info.model,
          platform: req.body.device_info.platform,
          version: req.body.device_info.version,
          ipAddress: req.body.device_info.ip,
          latitude: req.body.device_info.latitude,
          longitude: req.body.device_info.longitude,
          createdBy: data._id,
        },
        { new: true, upsert: true }
      );

      if (deviceInfo) {
        const payload = {
          id: data._id,
        };

        return await responseHandler(req, res, constants.message.success, {
          token:
            req.body.device_info.platform !== constants.deviceTypes.android &&
            req.body.device_info.platform !== constants.deviceTypes.iOS
              ? await createToken(payload)
              : await createTokenMobile(payload),
          data: await data.getAuthDetail(),
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const getDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.id, async () => {
      const data = await User.findOne({ _id: req.id });
      return data;
    });

    return await responseHandler(req, res, constants.message.userDetail, data);
  } catch (err) {
    next(err);
  }
};

const changePicture = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.id, async () => {
      const data = await User.findOne({ _id: req.id });
      return data;
    });

    if (data) {
      req.file &&
        data.photo?.localUrl &&
        (await removePhoto(await getFileName(data.photo?.localUrl)));

      User.findOneAndUpdate(
        { _id: data.id },
        {
          "photo.localUrl": await photoURL(req.headers.host, req.file.filename),
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          await clearKey(req.id);
          return await responseHandler(
            req,
            res,
            constants.message.pictureSuccess
          );
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const updateDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    User.findOneAndUpdate(
      { _id: req.id },
      {
        "name.firstName": req.body.first_name,
        "name.middleName": req.body.middle_name,
        "name.lastName": req.body.last_name,
        gender: req.body.gender,
        dob: req.body.date_of_birth,
      },
      { new: true }
    ).then(async (data) => {
      if (data) {
        await clearKey(req.id);
        return await responseHandler(req, res, constants.message.userUpdate);
      }
    });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user: any = await User.findOne({
      _id: req.id,
      "email.value": req.body.email,
    });

    if (!user) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.emailNotRegistered
        )
      );
    } else if (user.email?.isVerified) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.emailAlreadyVerified
        )
      );
    } else {
      const data: any = await OTP.findOne({
        email: user.email.value,
      });

      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else if ((await minutes(data.updatedAt)) >= 5) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            constants.message.otpExpire
          )
        );
      } else if (data.otp !== req.body.otp) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            constants.message.invalidOTP
          )
        );
      } else {
        User.findOneAndUpdate(
          { _id: req.id, "email.value": user.email.value },
          {
            "email.isVerified": true,
          },
          { new: true }
        ).then(async (data: any) => {
          if (data) {
            OTP.findOneAndDelete({
              email: data.email.value,
            }).then(async (data) => {
              await clearKey(req.id);
              return await responseHandler(
                req,
                res,
                constants.message.emailVerified
              );
            });
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const verifyPhone = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user: any = await User.findOne({
      _id: req.id,
      "phone.value": req.body.phone,
    });

    if (!user) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.phoneNotRegistered
        )
      );
    } else if (user.phone?.isVerified) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.phoneAlreadyVerified
        )
      );
    } else {
      const data: any = await OTP.findOne({
        "phone.value": user.phone.value,
      });

      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else if ((await minutes(data.updatedAt)) >= 5) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            constants.message.otpExpire
          )
        );
      } else if (data.otp !== req.body.otp) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            constants.message.invalidOTP
          )
        );
      } else {
        User.findOneAndUpdate(
          { _id: req.id, "phone.value": user.phone.value },
          {
            "phone.isVerified": true,
            isVerified: true,
          },
          { new: true }
        ).then(async (data: any) => {
          if (data) {
            OTP.findOneAndDelete({
              "phone.value": data.phone.value,
            }).then(async (data) => {
              await clearKey(req.id);
              return await responseHandler(
                req,
                res,
                constants.message.phoneVerified
              );
            });
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const updateEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await OTP.findOne({
      email: req.body.email,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else if ((await minutes(data.updatedAt)) >= 5) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.otpExpire
        )
      );
    } else if (data.otp !== req.body.otp) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidOTP
        )
      );
    } else {
      User.findOneAndUpdate(
        { _id: req.id, role: { $nin: [constants.accountLevel.superAdmin] } },
        {
          email: {
            value: data.email,
            isVerified: true,
          },
        },
        { new: true }
      ).then(async (data: any) => {
        if (!data) {
          return next(
            await createError(
              constants.code.dataNotFound,
              constants.message.dataNotFound
            )
          );
        } else {
          OTP.findOneAndDelete({
            email: data.email.value,
          }).then(async (data) => {
            await clearKey(req.id);
            return await responseHandler(
              req,
              res,
              constants.message.emailUpdated
            );
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const updatePhone = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await OTP.findOne({
      "phone.value": req.body.phone,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else if ((await minutes(data.updatedAt)) >= 5) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.otpExpire
        )
      );
    } else if (data.otp !== req.body.otp) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidOTP
        )
      );
    } else {
      User.findOneAndUpdate(
        { _id: req.id, role: { $nin: [constants.accountLevel.superAdmin] } },
        {
          phone: {
            isoCode: data.phone.isoCode,
            value: data.phone.value,
            isVerified: true,
          },
          isVerified: true,
        },
        { new: true }
      ).then(async (data: any) => {
        if (!data) {
          return next(
            await createError(
              constants.code.dataNotFound,
              constants.message.dataNotFound
            )
          );
        } else {
          OTP.findOneAndDelete({
            "phone.value": data.phone.value,
          }).then(async (data) => {
            await clearKey(req.id);
            return await responseHandler(
              req,
              res,
              constants.message.phoneUpdated
            );
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.body.old_password === req.body.new_password) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.differentPassword
        )
      );
    } else {
      const data: any = await User.findOne({
        _id: req.id,
        role: { $nin: [constants.accountLevel.superAdmin] },
      });

      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else if (
        !(await checkPassword(req.body.old_password, data.password.value))
      ) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            constants.message.invalidOldPassword
          )
        );
      } else {
        User.findOneAndUpdate(
          { _id: req.id },
          {
            "password.value": await hashPassword(req.body.new_password),
          },
          { new: true }
        ).then(async (data) => {
          if (data) {
            return await responseHandler(
              req,
              res,
              constants.message.passwordChange
            );
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const manageAuthentication = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    User.findOneAndUpdate(
      { _id: req.id },
      {
        is2FA: req.body.is_2FA,
      },
      { new: true }
    ).then(async (data: any) => {
      await clearKey(req.id);
      if (!data.is2FA) {
        return await responseHandler(req, res, constants.message.twoFactorOff);
      } else {
        return await responseHandler(req, res, constants.message.twoFactoreOn);
      }
    });
  } catch (err) {
    next(err);
  }
};

const managePushNotification = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    User.findOneAndUpdate(
      { _id: req.id },
      {
        "notification.pushNotification": req.body.is_notification,
      },
      { new: true }
    ).then(async (data: any) => {
      await clearKey(req.id);
      if (!data.notification.pushNotification) {
        return await responseHandler(
          req,
          res,
          constants.message.pushNotificationOff
        );
      } else {
        return await responseHandler(
          req,
          res,
          constants.message.pushNotificationOn
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const manageEmailNotification = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    User.findOneAndUpdate(
      { _id: req.id },
      {
        "notification.emailNotification": req.body.is_notification,
      },
      { new: true }
    ).then(async (data: any) => {
      await clearKey(req.id);
      if (!data.notification.emailNotification) {
        return await responseHandler(
          req,
          res,
          constants.message.emailNotificationOff
        );
      } else {
        return await responseHandler(
          req,
          res,
          constants.message.emailNotificationOn
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const manageMessageNotification = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    User.findOneAndUpdate(
      { _id: req.id },
      {
        "notification.messageNotification": req.body.is_notification,
      },
      { new: true }
    ).then(async (data: any) => {
      await clearKey(req.id);
      if (!data.notification.messageNotification) {
        return await responseHandler(
          req,
          res,
          constants.message.messageNotificationOff
        );
      } else {
        return await responseHandler(
          req,
          res,
          constants.message.messageNotificationOn
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const deactivateAccount = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.status) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      User.findOneAndUpdate(
        { _id: req.id, role: { $nin: [constants.accountLevel.superAdmin] } },
        {
          status: req.body.status,
        },
        { new: true }
      ).then(async (data: any) => {
        if (!data) {
          return next(
            await createError(
              constants.code.dataNotFound,
              constants.message.dataNotFound
            )
          );
        } else {
          await clearKey(req.id);
          return await responseHandler(req, res, constants.message.userDisable);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      User.findOneAndUpdate(
        { _id: req.id, role: { $nin: [constants.accountLevel.superAdmin] } },
        {
          isDeleted: req.body.is_delete,
        },
        { new: true }
      ).then(async (data: any) => {
        if (!data) {
          return next(
            await createError(
              constants.code.dataNotFound,
              constants.message.dataNotFound
            )
          );
        } else {
          await clearKey(req.id);
          return await responseHandler(req, res, constants.message.userDeleted);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const logout = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (await deleteToken(req.token)) {
      await clearKey(req.id);
      return await responseHandler(req, res, constants.message.logout);
    }
  } catch (err) {
    next(err);
  }
};

const logoutFromAll = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (await deleteAllToken(req.token)) {
      await clearKey(req.id);
      return await responseHandler(req, res, constants.message.logoutAll);
    }
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: any = await User.findOneAndUpdate(
      {
        "email.value": req.body.email,
        role: {
          $nin: [
            constants.accountLevel.superAdmin,
            constants.accountLevel.user,
          ],
        },
      },
      { userVerificationToken: await randomString(48) },
      { new: true }
    );

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.emailNotRegistered
        )
      );
    } else {
      const mailPayload = {
        to: data.email.value,
        title: constants.templateTitle.resetPassword,
        data: `${process.env.ADMIN_RESET_ADDRESS}${data.userVerificationToken}`,
      };

      emailQueue.add(data.email.value, mailPayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      return await responseHandler(
        req,
        res,
        constants.message.resetPasswordEmail
      );
    }
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: any = await User.findOne({
      userVerificationToken: req.body.user_verification_token,
      role: {
        $nin: [constants.accountLevel.superAdmin, constants.accountLevel.user],
      },
    });

    if (!data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidVerificationToken
        )
      );
    } else if ((await minutes(data.updatedAt)) >= 10) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.tokenExpire
        )
      );
    } else if (await checkPassword(req.body.password, data.password.value)) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.differentPassword
        )
      );
    } else {
      User.findOneAndUpdate(
        {
          _id: data._id,
          role: {
            $nin: [
              constants.accountLevel.superAdmin,
              constants.accountLevel.user,
            ],
          },
        },
        {
          "password.value": await hashPassword(req.body.password),
          $unset: { userVerificationToken: 1 },
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          return await responseHandler(
            req,
            res,
            constants.message.passwordChange
          );
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export default {
  login,
  loginWithOTP,
  getDetail,
  changePicture,
  updateDetail,
  verifyEmail,
  verifyPhone,
  updateEmail,
  updatePhone,
  changePassword,
  manageAuthentication,
  managePushNotification,
  manageEmailNotification,
  manageMessageNotification,
  deactivateAccount,
  deleteAccount,
  logout,
  logoutFromAll,
  forgotPassword,
  resetPassword,
};
