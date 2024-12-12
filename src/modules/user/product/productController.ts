import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError } from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./productConstant";
import Product from "@/models/product";
import { Types } from "mongoose";

const productList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Product.aggregate([
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
            {
              ...(req.query.filter.brandId
                ? {
                    brandId: new Types.ObjectId(req.query.filter.brandId),
                  }
                : {}),
            },
          ],
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "wishlists",
          let: { itemId: "$_id" },
          pipeline: [
            {
              $unwind: {
                path: "$items",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$items.itemId", "$$itemId"] },
                    { $eq: ["$userId", new Types.ObjectId(req.id)] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "wishList",
        },
      },
      {
        $lookup: {
          from: "reviews",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$productId"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$productId",
                rating: { $avg: "$rating" },
                users: { $sum: 1 },
              },
            },
          ],
          as: "ratings",
        },
      },
      {
        $unwind: {
          path: "$ratings",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          images: { $first: "$images" },
          name: 1,
          slug: 1,
          SKU: 1,
          mrp: 1,
          sellingPrice: 1,
          createdAt: { $toLong: "$createdAt" },
          isLiked: {
            $cond: [{ $eq: [{ $size: "$wishList" }, 1] }, true, false],
          },
          rating: { $round: [{ $ifNull: ["$ratings.rating", 0] }, 1] },
          ratedBy: { $ifNull: ["$ratings.users", 0] },
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
          message.productListSuccess,
          data
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.product_id, async () => {
      const data = await Product.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(req.params.product_id),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$isDeleted", false] },
                      { type: constants.catalougeTypes.product },
                    ],
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
            as: "categoryId",
          },
        },
        {
          $unwind: {
            path: "$categoryId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brandId",
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
            as: "brandId",
          },
        },
        {
          $unwind: {
            path: "$brandId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "wishlists",
            let: { itemId: "$_id" },
            pipeline: [
              {
                $unwind: {
                  path: "$items",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$items.itemId", "$$itemId"] },
                      { $eq: ["$userId", new Types.ObjectId(req.id)] },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
            ],
            as: "wishList",
          },
        },
        {
          $lookup: {
            from: "reviews",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$productId", "$$productId"] },
                      { $eq: ["$isDeleted", false] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "users",
                  let: { userId: "$userId" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$_id", "$$userId"] },
                            { $eq: ["$isDeleted", false] },
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        id: "$_id",
                        name: 1,
                        photo: 1,
                      },
                    },
                  ],
                  as: "users",
                },
              },
              {
                $group: {
                  _id: "$productId",
                  rating: { $avg: "$rating" },
                  users: { $sum: 1 },
                  userList: {
                    $push: {
                      id: "$users.id",
                      name: "$users.name",
                      photo: "$users.photo",
                      rating: "$rating",
                      description: "$description",
                      images: "$images",
                      createdAt: { $toLong: "$createdAt" },
                    },
                  },
                },
              },
            ],
            as: "ratings",
          },
        },
        {
          $unwind: {
            path: "$ratings",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            id: "$id",
            images: 1,
            name: 1,
            slug: 1,
            description: 1,
            category: "$categoryId",
            brand: "$brandId",
            SKU: 1,
            HSN: 1,
            manufacturedDate: { $toLong: "$manufacturedDate" },
            weight: 1,
            measurement: 1,
            origin: 1,
            currency: 1,
            tax: 1,
            mrp: 1,
            sellingPrice: 1,
            taxIncluded: 1,
            discount: {
              $ceil: {
                $multiply: [
                  {
                    $divide: [{ $subtract: ["$mrp", "$sellingPrice"] }, "$mrp"],
                  },
                  100,
                ],
              },
            },
            additionalCharge: 1,
            specification: 1,
            quantity: 1,
            isVerified: 1,
            returnPeriod: 1,
            isLiked: {
              $cond: [{ $eq: [{ $size: "$wishList" }, 1] }, true, false],
            },
            rating: { $round: [{ $ifNull: ["$ratings.rating", 0] }, 1] },
            ratedBy: { $ifNull: ["$ratings.users", 0] },
            userList: "$ratings.userList",
          },
        },
      ]);
      return data[0];
    });

    if (!data) {
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
        message.productDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

export default {
  productList,
  detail,
};
