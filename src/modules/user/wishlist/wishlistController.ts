import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { createError } from "@/helpers/helper";
import { Types } from "mongoose";
import constants from "@/utils/constants";
import message from "./wishlistConstant";
import Wishlist from "@/models/wishlist";
import Product from "@/models/product";
import { clearKey } from "@/config/redis";

const addItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await Wishlist.exists({
      userId: req.id,
      "items.itemId": req.body.product_id,
      isDeleted: false,
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.alreadyExist
        )
      );
    } else {
      const product = await Product.exists({
        _id: req.body.product_id,
        isDeleted: false,
      });

      if (!product) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        Wishlist.findOneAndUpdate(
          {
            userId: req.id,
            isDeleted: false,
          },
          {
            userId: req.id,
            $push: {
              items: {
                itemId: product._id,
              },
            },
          },
          { new: true, upsert: true }
        ).then(async (data) => {
          if (data) {
            await clearKey(req.body.product_id);
            return await responseHandler(req, res, message.itemSuccess);
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const wishList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Wishlist.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.id),
          isDeleted: false,
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.itemId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$isDeleted", false] }],
                },
              },
            },
          ],
          as: "items.item",
        },
      },
      {
        $unwind: "$items.item",
      },
      {
        $project: {
          _id: 0,
          id: "$items.item._id",
          images: { $first: "$items.item.images" },
          name: "$items.item.name",
          slug: "$items.item.slug",
          SKU: "$items.item.SKU",
          taxIncluded: "$items.item.mrp.type",
          mrp: "$items.item.mrp.value",
          sellingPrice: "$items.item.sellingPrice.value",
          createdAt: { $toLong: "$createdAt" },
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
        return await responseHandler(req, res, message.wishlListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      Wishlist.findOneAndUpdate(
        {
          userId: req.id,
          isDeleted: false,
          "items.itemId": req.params.item_id,
        },
        {
          $pull: {
            items: {
              itemId: req.params.item_id,
            },
          },
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
          return await responseHandler(req, res, message.itemDeletedSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export default {
  addItem,
  wishList,
  deleteItem,
};
