import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { emailQueue } from "@/helpers/queue/queue";
import {
  createError,
  createPassword,
  getFileName,
  getUserName,
  hashPassword,
  photoURL,
  removePhoto,
  toLowerCase,
} from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./userConstant";
import User from "@/models/user";
import { Types } from "mongoose";
import Activity from "@/models/activity";

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await User.create({
      name: {
        firstName: req.body.first_name,
        middleName: req.body.middle_name,
        lastName: req.body.last_name,
      },
      username: await getUserName(await toLowerCase(req.body.email)),
      email: {
        value: req.body.email,
      },
      phone: {
        isoCode: req.body.iso_code,
        value: req.body.phone,
      },
      gender: req.body.gender,
      dob: req.body.date_of_birth,
      password: {
        value: await hashPassword(
          await createPassword(req.body.first_name, req.body.date_of_birth)
        ),
      },
      role: req.body.role,
      privileges: req.body.privileges,
      createdBy: req.id,
    });

    if (data) {
      const mailPayload = {
        to: data.email.value,
        title: constants.templateTitle.credential,
        data: {
          name: data.name.firstName,
          email: data.email.value,
        },
      };

      emailQueue.add(data.email.value, mailPayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      return await responseHandler(req, res, message.userAddSuccess);
    }
  } catch (err) {
    next(err);
  }
};

const usersList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    User.aggregate([
      {
        $match: {
          _id: { $nin: [new Types.ObjectId(req.id)] },
          role: { $nin: [constants.accountLevel.superAdmin] },
          $and: [
            {
              $or: [
                {
                  "name.firstName": {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
                {
                  "email.value": {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
                {
                  "phone.value": Number(req.query.search),
                },
              ],
            },
            {
              ...(req.query.filter.role
                ? { role: Number(req.query.filter.role) }
                : {}),
            },
            {
              ...(req.query.filter.gender
                ? { gender: req.query.filter.gender }
                : {}),
            },
            {
              ...(req.query.filter.premium
                ? {
                    isPremium:
                      req.query.filter.premium === "true" ? true : false,
                  }
                : {}),
            },
          ],
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: 1,
              },
            },
          ],
          as: "createdBy",
        },
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "updatedBy",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: 1,
              },
            },
          ],
          as: "updatedBy",
        },
      },
      {
        $unwind: {
          path: "$updatedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "devices",
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
            {
              $sort: { updatedAt: -1 },
            },
            {
              $group: {
                _id: "$userId",
                lastLogin: { $first: { $toLong: "$updatedAt" } },
              },
            },
          ],
          as: "lastLogin",
        },
      },
      {
        $unwind: {
          path: "$lastLogin",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          photo: 1,
          name: 1,
          email: "$email.value",
          phone: "$phone.value",
          dob: { $toLong: "$dob" },
          gender: 1,
          isPremium: 1,
          status: 1,
          isDeleted: 1,
          role: 1,
          createdAt: { $toLong: "$createdAt" },
          updatedAt: { $toLong: "$updatedAt" },
          createdBy: 1,
          updatedBy: 1,
          lastLogin: 1,
        },
      },
      {
        $sort: { createdAt: sort },
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
        return await responseHandler(req, res, message.userListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.user_id, async () => {
      const data = await User.findOne({
        _id: req.params.user_id,
        role: { $nin: [constants.accountLevel.superAdmin] },
        isDeleted: false,
      });
      return data;
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.userDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const changePicture = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.user_id, async () => {
      const data = await User.findOne({
        _id: req.params.user_id,
        role: { $nin: [constants.accountLevel.superAdmin] },
        isDeleted: false,
      });
      return data;
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else if (!data.photo?.localUrl) {
      User.findOneAndUpdate(
        { _id: data.id },
        {
          photo: {
            localUrl: await photoURL(req.headers.host, req.file.filename),
          },
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          await clearKey(req.params.user_id);
          return await responseHandler(req, res, message.userPictureSuccess);
        }
      });
    } else {
      await removePhoto(await getFileName(data.photo?.localUrl));
      User.findOneAndUpdate(
        { _id: data.id },
        {
          photo: {
            localUrl: await photoURL(req.headers.host, req.file.filename),
          },
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          await clearKey(req.params.user_id);
          return await responseHandler(req, res, message.userPictureSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.user_id, async () => {
      const data = await User.findOne({
        _id: req.params.user_id,
        role: { $nin: [constants.accountLevel.superAdmin] },
        isDeleted: false,
      });
      return data;
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      User.exists({
        "email.value": await toLowerCase(req.body.email),
        _id: { $nin: [req.params.user_id] },
      }).then(async (data) => {
        if (data) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              constants.message.emailTaken
            )
          );
        } else {
          User.exists({
            "phone.value": req.body.phone,
            _id: { $nin: [req.params.user_id] },
          }).then(async (data) => {
            if (data) {
              return next(
                await createError(
                  constants.code.preconditionFailed,
                  constants.message.phoneTaken
                )
              );
            } else {
              User.findOneAndUpdate(
                {
                  _id: req.params.user_id,
                  role: { $nin: [constants.accountLevel.superAdmin] },
                  isDeleted: false,
                },
                {
                  name: {
                    firstName: req.body.first_name,
                    middleName: req.body.middle_name,
                    lastName: req.body.last_name,
                  },
                  email: {
                    value: req.body.email,
                    isVerified: false,
                  },
                  phone: {
                    isoCode: req.body.iso_code,
                    value: req.body.phone,
                    isVerified: false,
                  },
                  gender: req.body.gender,
                  dob: req.body.date_of_birth,
                  role: req.body.role,
                  privileges: req.body.privileges,
                  updatedBy: req.id,
                },
                { new: true }
              ).then(async (data) => {
                if (data) {
                  await clearKey(req.params.user_id);
                  return await responseHandler(
                    req,
                    res,
                    message.userUpdateSuccess
                  );
                }
              });
            }
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    User.findOneAndUpdate(
      {
        _id: req.params.user_id,
        role: { $nin: [constants.accountLevel.superAdmin] },
        isDeleted: false,
      },
      {
        "password.value": await hashPassword(req.body.password),
        updatedBy: req.id,
      },
      { new: true }
    ).then(async (data) => {
      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        await clearKey(req.params.user_id);
        return await responseHandler(
          req,
          res,
          constants.message.passwordChange
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const manageAccount = async (req: any, res: Response, next: NextFunction) => {
  try {
    User.findOneAndUpdate(
      {
        _id: req.params.user_id,
        role: { $nin: [constants.accountLevel.superAdmin] },
        isDeleted: false,
      },
      {
        status: req.body.status,
        updatedBy: req.id,
      },
      { new: true }
    ).then(async (data) => {
      if (!data) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else if (!data.status) {
        await clearKey(req.params.user_id);
        return await responseHandler(req, res, message.accDeactivated);
      } else {
        await clearKey(req.params.user_id);
        return await responseHandler(req, res, message.accActivated);
      }
    });
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
      const data: any = await User.find({
        _id: { $in: req.body.user_id },
        role: { $nin: [constants.accountLevel.superAdmin] },
        isDeleted: false,
      });

      if (!data.length) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        User.updateMany(
          {
            _id: { $in: req.body.user_id },
            role: { $nin: [constants.accountLevel.superAdmin] },
            isDeleted: false,
          },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.user_id.length; i++) {
              await clearKey(req.body.user_id[i]);
            }
            await Activity.updateMany(
              {
                userId: { $in: req.body.user_id },
                isDeleted: false,
              },
              { isDeleted: true}
            )
            return await responseHandler(req, res, message.accDeleted);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  usersList,
  detail,
  changePicture,
  update,
  resetPassword,
  manageAccount,
  deleteAccount,
};
