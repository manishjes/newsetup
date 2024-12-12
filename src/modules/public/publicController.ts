import { Request, Response, NextFunction } from "express";
import constants from "@/utils/constants";
import message from "./publicConstant";
import Setting from "@/models/setting";
import { getOrSetCache } from "@/config/redis";
import { createError, minutes, randomNumber } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { emailQueue, messageQueue } from "@/helpers/queue/queue";
import OTP from "@/models/otp";
import User from "@/models/user";
import Country from "@/models/country";
import State from "@/models/state";
import City from "@/models/city";
import Location from "@/models/location";
import Skill from "@/models/skill";
import { Types } from "mongoose";
import Category from "@/models/category";

const getAccessKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.access_token !== process.env.ACCESS_TOKEN) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.invalidToken
        )
      );
    } else {
      const data = await getOrSetCache("accessKey", async () => {
        const data = await Setting.findOne({}, { accessKey: 1 });
        return data;
      });

      return await responseHandler(req, res, constants.message.success, data);
    }
  } catch (err) {
    next(err);
  }
};

const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = await OTP.findOneAndUpdate(
      {
        $or: [{ email: req.body.email }, { "phone.value": req.body.phone }],
      },
      {
        email: req.body.email,
        phone: {
          isoCode: req.body.iso_code,
          value: req.body.phone,
        },
        otp: await randomNumber(),
      },
      { new: true, upsert: true }
    );

    if (data) {
      const mailPayload = {
        to: data.email,
        title: constants.templateTitle.otp,
        data: data?.otp,
      };

      emailQueue.add(data.email, mailPayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      const messagePayload = {
        to: data.phone.value,
        title: constants.templateTitle.otp,
        data: data?.otp,
      };

      messageQueue.add(data.phone.value, messagePayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      return await responseHandler(req, res, constants.message.otpSent);
    }
  } catch (err) {
    next(err);
  }
};

const sendMessageOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: any = await OTP.findOneAndUpdate(
      {
        "phone.value": req.body.phone,
      },
      {
        phone: {
          isoCode: req.body.iso_code,
          value: req.body.phone,
        },
        otp: await randomNumber(),
      },
      { new: true, upsert: true }
    );

    if (data) {
      const messagePayload = {
        to: data.phone.value,
        title: constants.templateTitle.otp,
        data: data?.otp,
      };

      messageQueue.add(data.phone.value, messagePayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      return await responseHandler(req, res, constants.message.otpMessageSent);
    }
  } catch (err) {
    next(err);
  }
};

const sendMailOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: any = await OTP.findOneAndUpdate(
      {
        email: req.body.email,
      },
      {
        email: req.body.email,
        otp: await randomNumber(),
      },
      { new: true, upsert: true }
    );

    if (data) {
      const mailPayload = {
        to: data.email,
        title: constants.templateTitle.otp,
        data: data?.otp,
      };

      emailQueue.add(data.email, mailPayload, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      return await responseHandler(req, res, constants.message.otpMailSent);
    }
  } catch (err) {
    next(err);
  }
};

const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    OTP.findOne({
      $or: [{ email: req.body.email }, { "phone.value": req.body.phone }],
    }).then(async (data) => {
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
        OTP.findOneAndDelete({
          $or: [{ email: req.body.email }, { "phone.value": req.body.phone }],
        }).then(async (data) => {
          return await responseHandler(req, res, constants.message.otpSuccess);
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

const emailAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getOrSetCache(req.body.email, async () => {
      const data = await User.findOne(
        { "email.value": req.body.email },
        { email: 1, phone: 1 }
      );
      return data;
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.emailTaken
        )
      );
    } else {
      return await responseHandler(req, res, constants.message.emailAvailable);
    }
  } catch (err) {
    next(err);
  }
};

const phoneAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getOrSetCache(req.body.phone, async () => {
      const data = await User.findOne(
        { "phone.value": req.body.phone },
        { phone: 1 }
      );
      return data;
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.phoneTaken
        )
      );
    } else {
      return await responseHandler(req, res, constants.message.phoneAvailable);
    }
  } catch (err) {
    next(err);
  }
};

const usernameAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getOrSetCache(req.body.username, async () => {
      const data = await User.findOne(
        { username: req.body.username },
        { username: 1, phone: 1 }
      );
      return data;
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.usernameTaken
        )
      );
    } else {
      return await responseHandler(
        req,
        res,
        constants.message.usernameAvailable
      );
    }
  } catch (err) {
    next(err);
  }
};

const countryList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await Country.find();

    if (!data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.countryListSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const stateList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.body.country_id, async () => {
      const data = await State.find({ countryId: req.body.country_id });
      return data;
    });

    if (!data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.stateListSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const cityList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.body.state_id, async () => {
      const data = await City.find({ stateId: req.body.state_id });
      return data;
    });

    if (!data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.cityListSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const localityDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getOrSetCache(req.body.pincode, async () => {
      const data = await Location.aggregate([
        {
          $match: {
            pincode: req.body.pincode,
          },
        },
        {
          $lookup: {
            from: "cities",
            foreignField: "_id",
            localField: "cityId",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$isDeleted", false] }],
                  },
                },
              },
            ],
            as: "city",
          },
        },
        {
          $unwind: {
            path: "$city",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "states",
            foreignField: "_id",
            localField: "city.stateId",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$isDeleted", false] }],
                  },
                },
              },
            ],
            as: "state",
          },
        },
        {
          $unwind: {
            path: "$state",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "countries",
            foreignField: "_id",
            localField: "state.countryId",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$isDeleted", false] }],
                  },
                },
              },
            ],
            as: "country",
          },
        },
        {
          $unwind: {
            path: "$country",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            name: 1,
            city: "$city.name",
            state: "$state.name",
            country: "$country.name",
          },
        },
      ]);
      return data;
    });

    if (!data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.localitySuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const maintenanceDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: any = await Setting.findOne({
      isDeleted: false,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.maintenanceSuccess, {
        status: data.maintenance.status,
        time: new Date(data.maintenance.time).getTime(),
      });
    }
  } catch (err) {
    next(err);
  }
};

const skillList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Skill.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  name: {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
              ],
            },
            {
              ...(req.query.filter.categoryId
                ? {
                    categoryId: new Types.ObjectId(req.query.filter.categoryId),
                  }
                : {}),
            },
          ],
          isDeleted: false,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          slug: 1,
          isPremium: 1,
          image: 1,
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
        return await responseHandler(req, res, message.skillListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};
const categoryList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Category.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  name: {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
              ],
            },
            {
              type: "skill",
            },
          ],
          isDeleted: false,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          slug: 1,
          type: 1,
          image: 1,
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
        return await responseHandler(
          req,
          res,
          message.categoryListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};
export default {
  getAccessKey,
  sendOTP,
  sendMessageOTP,
  sendMailOTP,
  verifyOTP,
  emailAvailability,
  phoneAvailability,
  usernameAvailability,
  countryList,
  stateList,
  cityList,
  localityDetail,
  maintenanceDetail,
  skillList,
  categoryList
};
