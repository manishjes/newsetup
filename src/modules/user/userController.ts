import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import {
  createError,
  createPassword,
  generateReferralCode,
  hashPassword,
  minutes,
  jwtDecode,
  toLowerCase
} from "@/helpers/helper";
import constants from "@/utils/constants";
import User from "@/models/user";
import Device from "@/models/device";
import {
  createToken,
  createTokenMobile,
  deleteAllToken,
  deleteToken
} from "@/helpers/token";
import message from "./userConstant";
import OTP from "@/models/otp";
import Referral from "@/models/referral";
import mongoose, { Types } from "mongoose";
import Skill from "@/models/skill";
import Activity from "@/models/activity";
import Category from "@/models/category";

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.user_acceptance) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.reqUserAcceptance
        )
      );
    } else {
      const categories: any = await Category.find(
        {
          _id: { $in: req.body.interests },
          isDeleted: false,
        },
        {
          categoryId: "$_id",
          _id: 0,
        }
      );

      if (!categories.length) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        User.create({
          name: {
            firstName: req.body.first_name,
            middleName: req.body.middle_name,
            lastName: req.body.last_name,
          },
          username: req.body.username,
          email: {
            value: req.body.email,
          },
          phone: {
            isoCode: req.body.iso_code,
            value: req.body.phone,
          },
          password: {
            value: await hashPassword(
              await createPassword(req.body.first_name, req.body.date_of_birth)
            ),
          },
          dob: req.body.date_of_birth,
          acceptance: {
            terms: { isAccepted: req.body.user_acceptance },
            privacy: { isAccepted: req.body.user_acceptance },
          },
          role: constants.accountLevel.user,
        }).then(async (user) => {
          if (user) {
            await Activity.create({
              userId: user._id,
              interests: categories,
              lives: {
                value: 3,
              },
              createdBy: user._id,
            });

            Referral.create({
              userId: user._id,
              referralCode: await generateReferralCode(),
              createdBy: user._id,
            }).then(async (data) => {
              if (data) {
                if (req.body.referral_code) {
                  Referral.findOneAndUpdate(
                    {
                      referralCode: req.body.referral_code,
                      isDeleted: false,
                    },
                    {
                      $push: {
                        referred: {
                          userId: data.userId,
                        },
                      },
                    },
                    { new: true }
                  ).then(async (data) => {
                    if (data) {
                      return await responseHandler(
                        req,
                        res,
                        message.userSuccess
                      );
                    }
                  });
                } else {
                  return await responseHandler(req, res, message.userSuccess);
                }
              }
            });
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
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
    } else if (data.role !== constants.accountLevel.user) {
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

const googleLogin = async(req: Request, res: Response, next: NextFunction)=>{
  try {
    const googleData: any = await jwtDecode(req.body.credential);
    const data: any = await User.findOne({
      "email.value":  await toLowerCase(googleData.email),
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
    } else if (data.role !== constants.accountLevel.user) {
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
}

const getDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    // const data = await getOrSetCache(req.id, async () => {

    //   return data[0];
    // });

    const data = await User.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(req.id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "referrals",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "referral",
        },
      },
      {
        $unwind: {
          path: "$referral",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "activities",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "activity",
        },
      },
      {
        $unwind: {
          path: "$activity",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          photo: 1,
          name: 1,
          username: 1,
          email: 1,
          phone: 1,
          dob: { $toLong: "$dob" },
          gender: 1,
          isPremium: 1,
          isVerified: 1,
          notification: 1,
          referralCode: "$referral.referralCode",
          walnut: { $ifNull: ["$activity.walnut.remaining", 0] },
          xp: { $ifNull: ["$activity.xp.remaining", 0] },
          streak: { $toInt: "0" },
          lives: {
            value: "$activity.lives.value",
            updatedOn: {
              $toLong: "$activity.lives.updatedOn",
            },
          },
        },
      },
    ]);

    return await responseHandler(
      req,
      res,
      constants.message.userDetail,
      data[0]
    );
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
      User.findOneAndUpdate(
        { _id: data.id },
        {
          "photo.bucketUrl": req.body.picture,
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
              "phone.value": user.phone.value,
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
        { _id: req.id },
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
        { _id: req.id },
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
        { _id: req.id },
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
        { _id: req.id },
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
          await  Activity.findOneAndUpdate(
            { userId: req.id },
            {
              isDeleted: req.body.is_delete,
            },
            { new: true }
          )
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


const badgesList = async(req:any, res:Response, next:NextFunction)=>{

  try{
    Activity.aggregate([
      {
        $match:{
          isDeleted: false,
         userId: new mongoose.Types.ObjectId(req.id)
        }
      },
      
      {
        $lookup:{
          from: "categories",
          let:{userId: "$categoryBadges.categoryId"},
          pipeline:[
            {
              $match:{
                $expr: { $in: ["$_id", "$$userId"] },
                isDeleted: false,
              }
            },
          ],
          as: "batchDetail"
        }
      },
      {
        $unwind: {
          path: "$batchDetail",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project:{
          _id:0,
          name: "$batchDetail.name",
          image: "$batchDetail.image.localUrl"  
        }
      },
      



    ]).then(async (data) => {
      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        return await responseHandler(req, res, message.batchGetsuccess, data);
      }
    });
  } catch(err){
    next(err)
  }
}

const contectList = async(req:any, res:Response, next:NextFunction)=>{
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    const userNumbers = req.body.userNumbers

   

    const userappNumbers:any = await User.find({
      "phone.value": { $in: userNumbers },
      isDeleted: false
    }, { _id: 1 });

    // console.log(userappNumbers)
    const userIds:any = await userappNumbers.map((user:any) => user._id);

    //console.log(userIds)




  await  Activity.aggregate([
      {
        $match: {
          userId: {
            $in: userIds,
          },
          isDeleted: false,
        },
      },
    
      {
        $lookup: {
          from: "users",
          let: { included: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$included"] },
                isDeleted: false,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$userId",
          xp: "$xp.total",
          name: "$user.name",
          photo: "$user.photo",
        },
      },
      {
        $sort: { xp: sort },
      },
      {
        $facet: {
          metadata: [
            { $count: "total" },
            { $addFields: { page: Number(page) } },
            {
              $addFields: {
                totalPages: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    { $ceil: { $divide: ["$total", limit] } },
                    { $sum: [Number(page), Number(1)] },
                  ],
                },
              },
            },
            {
              $addFields: {
                hasPrevPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    {
                      $cond: [
                        {
                          $lt: [{ $subtract: [page, Number(1)] }, Number(0)],
                        },
                        false,
                        true,
                      ],
                    },
                    false,
                  ],
                },
              },
            },
            {
              $addFields: {
                prevPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    {
                      $cond: [
                        {
                          $lt: [{ $subtract: [page, Number(1)] }, Number(0)],
                        },
                        null,
                        { $subtract: [page, Number(1)] },
                      ],
                    },
                    null,
                  ],
                },
              },
            },
            {
              $addFields: {
                hasNextPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    {
                      $cond: [
                        {
                          $gt: [
                            {
                              $subtract: [
                                {
                                  $ceil: { $divide: ["$total", limit] },
                                },
                                Number(1),
                              ],
                            },
                            "$page",
                          ],
                        },
                        true,
                        false,
                      ],
                    },
                    false,
                  ],
                },
              },
            },
            {
              $addFields: {
                nextPage: {
                  $cond: [
                    Number(req.query.limit) !== 0,
                    { $sum: [page, Number(1)] },
                    null,
                  ],
                },
              },
            },
          ],
          data: data,
        },
      },
    ]).then(async (data) => {
      if (!data[0].data.length) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {

      
        return await responseHandler(
          req,
          res,
          constants.message.success,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
}

export default {
  register,
  login,
  getDetail,
  changePicture,
  updateDetail,
  verifyEmail,
  verifyPhone,
  updateEmail,
  updatePhone,
  manageAuthentication,
  managePushNotification,
  manageEmailNotification,
  manageMessageNotification,
  deactivateAccount,
  deleteAccount,
  logout,
  logoutFromAll,
  badgesList,
  googleLogin,
  contectList
};
