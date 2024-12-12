import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import {
  createError,
  generateOrderID,
  imageURL,
  removeImages,
} from "@/helpers/helper";
import { createOrderId, validatePayment } from "@/services/paymentService";
import constants from "@/utils/constants";
import message from "./orderConstant";
import Payment from "@/models/payment";
import Cart from "@/models/cart";
import Order from "@/models/order";
import { Types } from "mongoose";
import { clearKey, getOrSetCache } from "@/config/redis";
import Review from "@/models/review";
import {
  emailQueue,
  messageQueue,
  notificationQueue,
} from "@/helpers/queue/queue";

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderInfo = await createOrderId(Number(req.body.amount));

    if (!orderInfo) {
      return next(
        await createError(
          constants.code.internalServerError,
          constants.message.internalServerError
        )
      );
    } else {
      return await responseHandler(
        req,
        res,
        message.orderCreatedSuccess,
        orderInfo
      );
    }
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const paymentInfo: any = await validatePayment(req.body);

    if (paymentInfo) {
      const data = await Payment.findOneAndUpdate(
        {
          orderId: paymentInfo.order_id,
          paymentId: paymentInfo.id,
          isDeleted: false,
        },
        {
          userId: req.id,
          orderNumber: await generateOrderID(),
          orderId: paymentInfo.order_id,
          paymentId: paymentInfo.id,
          paymentMode: constants.paymentMode.prepaid,
          currency: paymentInfo.currency,
          amount: Number(Number(paymentInfo.amount) / 100),
          paymentMethod: paymentInfo.method,
          paymentDate: new Date(Number(paymentInfo.created_at) * 1000),
          status:
            paymentInfo.status === "failed"
              ? constants.paymentStatus.failed
              : constants.paymentStatus.paid,
          createdBy: req.id,
        },
        { new: true, upsert: true }
      );

      if (data.status === constants.paymentStatus.failed) {
        return next(
          await createError(
            constants.code.internalServerError,
            message.paymentFailed
          )
        );
      } else {
        return await responseHandler(req, res, message.paymentSuccess, {
          paymentId: data._id,
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

const placeOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await Cart.findOne({
      _id: req.body.cart_id,
      userId: req.id,
      isDeleted: false,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else if (!data.shippingAddress) {
      return next(
        await createError(
          constants.code.expectationFailed,
          message.shipAddNotExist
        )
      );
    } else if (!data.billingAddress) {
      return next(
        await createError(
          constants.code.expectationFailed,
          message.billAddNotExist
        )
      );
    } else if (!data.items.length) {
      return next(
        await createError(constants.code.expectationFailed, message.cartIsEmpty)
      );
    } else if (req.body.payment_mode === "prepaid") {
      const payment = await Payment.findOne({
        _id: req.body.payment_id,
        userId: req.id,
        isDeleted: false,
      });

      if (!payment) {
        return next(
          await createError(
            constants.code.expectationFailed,
            message.invalidPaymentId
          )
        );
      } else {
        Order.create({
          orderId: payment.orderNumber,
          orderType: constants.orderType.online,
          userId: req.id,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          items: data.items,
          total: data.total,
          discount: data.discount,
          discountPercent: data.discountPercent,
          taxableAmount: data.taxableAmount,
          taxAmount: data.taxAmount,
          subTotal: data.subTotal,
          additionalCharge: {
            shipping: data.additionalCharge.shipping,
            packaging: data.additionalCharge.packaging,
          },
          coupanDiscount: {
            code: data.coupanDiscount.code,
            discount: data.coupanDiscount.discount,
          },
          netAmount: data.netAmount,
          currency: {
            code: data.currency.code,
            symbol: data.currency.symbol,
          },
          status: {
            value: constants.orderStatus.open,
            createdOn: Date.now(),
          },
          createdBy: req.id,
        }).then(async (order) => {
          if (order) {
            Cart.findOneAndUpdate(
              {
                _id: data.id,
                userId: req.id,
                isDeleted: false,
              },
              { isDeleted: true },
              { new: true }
            ).then(async (data: any) => {
              if (data) {
                const notificationPayload = {
                  to: data.userId,
                  title: constants.templateTitle.orderConfirmation,
                  data: {},
                };

                notificationQueue.add(data.userId, notificationPayload, {
                  removeOnComplete: true,
                  removeOnFail: true,
                });

                const messagePayload = {
                  to: req.phone,
                  title: constants.templateTitle.orderConfirmation,
                  data: {},
                };

                messageQueue.add(req.phone, messagePayload, {
                  removeOnComplete: true,
                  removeOnFail: true,
                });


                return await responseHandler(req, res, message.orderSuccess);
              }
            });
          }
        });
      }
    } else {
      const payment = await Payment.create({
        userId: req.id,
        orderNumber: await generateOrderID(),
        paymentMode: constants.paymentMode.postpaid,
        currency: data.currency.code,
        amount: data.netAmount,
        paymentMethod: "Cash",
      });

      if (!payment) {
        return next(
          await createError(
            constants.code.internalServerError,
            constants.message.internalServerError
          )
        );
      } else {
        Order.create({
          orderId: payment.orderNumber,
          orderType: constants.orderType.online,
          userId: req.id,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          items: data.items,
          total: data.total,
          discount: data.discount,
          discountPercent: data.discountPercent,
          taxableAmount: data.taxableAmount,
          taxAmount: data.taxAmount,
          subTotal: data.subTotal,
          additionalCharge: {
            shipping: data.additionalCharge.shipping,
            packaging: data.additionalCharge.packaging,
          },
          coupanDiscount: {
            code: data.coupanDiscount.code,
            discount: data.coupanDiscount.discount,
          },
          netAmount: data.netAmount,
          currency: {
            code: data.currency.code,
            symbol: data.currency.symbol,
          },
          status: {
            value: constants.orderStatus.open,
            createdOn: Date.now(),
          },
          createdBy: req.id,
        }).then(async (order) => {
          if (order) {
            Cart.findOneAndUpdate(
              {
                _id: data.id,
                userId: req.id,
                isDeleted: false,
              },
              { isDeleted: true },
              { new: true }
            ).then(async (data: any) => {
              if (data) {
                const notificationPayload = {
                  to: data.userId,
                  title: constants.templateTitle.orderConfirmation,
                  data: {},
                };

                notificationQueue.add(data.userId, notificationPayload, {
                  removeOnComplete: true,
                  removeOnFail: true,
                });

                const messagePayload = {
                  to: req.phone,
                  title: constants.templateTitle.orderConfirmation,
                  data: {},
                };

                messageQueue.add(req.phone, messagePayload, {
                  removeOnComplete: true,
                  removeOnFail: true,
                });

                return await responseHandler(req, res, message.orderSuccess);
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

const orderList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Order.aggregate([
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
            {
              $lookup: {
                from: "reviews",
                let: { productId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$userId", new Types.ObjectId(req.id)] },
                          { $eq: ["$productId", "$$productId"] },
                        ],
                      },
                    },
                  },
                ],
                as: "review",
              },
            },
            {
              $addFields: {
                rating: {
                  $ifNull: [{ $arrayElemAt: ["$review.rating", 0] }, 0],
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
        $addFields: {
          itemStatus: { $last: "$items.status" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$items._id",
          images: { $first: "$items.item.images" },
          name: "$items.item.name",
          rating: "$items.item.rating",
          status: {
            value: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: ["$itemStatus.value", constants.orderStatus.open],
                    },
                    then: "Pending",
                  },
                  {
                    case: {
                      $eq: ["$itemStatus.value", constants.orderStatus.pending],
                    },
                    then: "Order Confirmed",
                  },
                  {
                    case: {
                      $eq: ["$itemStatus.value", constants.orderStatus.onHold],
                    },
                    then: "On Hold",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.awaitingFulfillment,
                      ],
                    },
                    then: "Order Confirmed by the seller",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.awaitingShipment,
                      ],
                    },
                    then: "Ready to ship",
                  },
                  {
                    case: {
                      $eq: ["$itemStatus.value", constants.orderStatus.shipped],
                    },
                    then: "Shipped",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.inTransit,
                      ],
                    },
                    then: "On the way",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.outForDelivery,
                      ],
                    },
                    then: "Out for delivery",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.completed,
                      ],
                    },
                    then: "Delivered",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.cancelled,
                      ],
                    },
                    then: "Cancelled",
                  },
                  {
                    case: {
                      $eq: [
                        "$itemStatus.value",
                        constants.orderStatus.returned,
                      ],
                    },
                    then: "Returned",
                  },
                  {
                    case: {
                      $eq: ["$itemStatus.value", constants.orderStatus.refund],
                    },
                    then: "Refund",
                  },
                ],
              },
            },
            updatedOn: { $toLong: "$itemStatus.updatedOn" },
          },
          createdAt: { $toLong: "$createdAt" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            id: "$id",
            images: "$images",
            name: "$name",
            rating: "$rating",
            status: {
              value: { $arrayElemAt: ["$status.value", 0] },
              updatedOn: { $arrayElemAt: ["$status.updatedOn", 0] },
            },
            createdAt: "$createdAt",
          },
        },
      },
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
              ...(req.query.filter.status
                ? {
                    "status.value": req.query.filter.status,
                  }
                : {}),
            },
          ],
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
        return await responseHandler(req, res, message.orderListSuccess, data);
      }
    });
  } catch (err) {
    next(err);
  }
};

const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.item_id, async () => {
      const data = await Order.aggregate([
        {
          $match: {
            orderType: constants.orderType.online,
            userId: new Types.ObjectId(req.id),
            "items._id": new Types.ObjectId(req.params.item_id),
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
              {
                $lookup: {
                  from: "reviews",
                  let: {
                    productId: "$_id",
                    userId: new Types.ObjectId(req.id),
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$productId", "$$productId"] },
                            { $eq: ["$userId", "$$userId"] },
                            { $eq: ["$isDeleted", false] },
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        id: "$_id",
                        rating: 1,
                      },
                    },
                  ],
                  as: "review",
                },
              },
              {
                $unwind: {
                  path: "$review",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 0,
                  id: "$_id",
                  images: { $first: "$images" },
                  name: 1,
                  review: "$review",
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
          $lookup: {
            from: "addresses",
            localField: "shippingAddress",
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
                  type: 1,
                  name: 1,
                  phone: 1,
                  line_one: "$address.line_one",
                  line_two: "$address.line_two",
                  city: "$address.city",
                  state: "$address.state",
                  country: "$address.country",
                  pincode: "$address.pincode",
                },
              },
            ],
            as: "shippingAddress",
          },
        },
        {
          $unwind: {
            path: "$shippingAddress",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            shippingAddress: { $first: "$shippingAddress" },
            currency: { $first: "$currency" },
            items: {
              $push: {
                id: "$items._id",
                name: "$items.item.name",
                images: "$items.item.images",
                quantity: "$items.quantity",
                mrp: "$items.mrp",
                sellingPrice: "$items.sellingPrice",
                taxIncluded: "$items.taxIncluded",
                total: "$items.total",
                discount: "$items.discount",
                discountPercent: "$items.discountPercent",
                taxableAmount: "$items.taxableAmount",
                taxAmount: "$items.taxAmount",
                subTotal: "$items.subTotal",
                additionalCharge: "$items.additionalCharge",
                coupanDiscount: "$items.coupanDiscount",
                netAmount: "$items.netAmount",
                review: "$items.item.review",
                status: {
                  $map: {
                    input: "$items.status",
                    as: "status",
                    in: {
                      value: {
                        $switch: {
                          branches: [
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.open,
                                ],
                              },
                              then: "Pending",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.pending,
                                ],
                              },
                              then: "Order Confirmed",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.onHold,
                                ],
                              },
                              then: "On Hold",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.awaitingFulfillment,
                                ],
                              },
                              then: "Order Confirmed by the seller",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.awaitingShipment,
                                ],
                              },
                              then: "Ready to ship",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.shipped,
                                ],
                              },
                              then: "Shipped",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.inTransit,
                                ],
                              },
                              then: "On the way",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.outForDelivery,
                                ],
                              },
                              then: "Out for delivery",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.completed,
                                ],
                              },
                              then: "Delivered",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.cancelled,
                                ],
                              },
                              then: "Cancelled",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.returned,
                                ],
                              },
                              then: "Returned",
                            },
                            {
                              case: {
                                $eq: [
                                  "$$status.value",
                                  constants.orderStatus.refund,
                                ],
                              },
                              then: "Refund",
                            },
                          ],
                        },
                      },
                      updatedOn: { $toLong: "$$status.updatedOn" },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            item: {
              $first: {
                $filter: {
                  input: "$items",
                  as: "item",
                  cond: {
                    $eq: ["$$item.id", new Types.ObjectId(req.params.item_id)],
                  },
                  limit: 1,
                },
              },
            },
          },
        },
        {
          $addFields: {
            otherItems: {
              $filter: {
                input: "$items",
                as: "item",
                cond: {
                  $ne: ["$$item.id", new Types.ObjectId(req.params.item_id)],
                },
              },
            },
          },
        },
        {
          $addFields: {
            otherItems: {
              $map: {
                input: "$otherItems",
                as: "item",
                in: {
                  id: "$$item.id",
                  name: "$$item.name",
                  images: "$$item.images",
                  status: {
                    $last: "$$item.status",
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            orderId: "$_id",
            shippingAddress: 1,
            currency: 1,
            id: "$item.id",
            name: "$item.name",
            images: "$item.images",
            quantity: "$item.quantity",
            mrp: "$item.mrp",
            sellingPrice: "$item.sellingPrice",
            taxIncluded: "$item.taxIncluded",
            total: "$item.total",
            discount: "$item.discount",
            discountPercent: "$item.discountPercent",
            taxableAmount: "$item.taxableAmount",
            taxAmount: "$item.taxAmount",
            subTotal: "$item.subTotal",
            additionalCharge: "$item.additionalCharge",
            coupanDiscount: "$item.coupanDiscount",
            netAmount: "$item.netAmount",
            rating: "$item.review.rating",
            status: "$item.status",
            otherItems: 1,
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
      return await responseHandler(req, res, message.orderDetailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Order.findOne({
      userId: req.id,
      items: {
        $elemMatch: {
          _id: req.params.item_id,
          "status.value": {
            $in: [constants.orderStatus.cancelled],
          },
        },
      },
      isDeleted: false,
    });

    if (data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Order.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(req.id),
            items: {
              $elemMatch: {
                _id: req.params.item_id,
                "status.value": {
                  $in: [
                    constants.orderStatus.open,
                    constants.orderStatus.pending,
                    constants.orderStatus.onHold,
                    constants.orderStatus.awaitingFulfillment,
                    constants.orderStatus.awaitingShipment,
                  ],
                },
              },
            },
            isDeleted: false,
          },
        },
      ]).then(async (data) => {
        res.send("good to go");
      });

      // Order.findOneAndUpdate(
      //   {
      //     userId: req.id,
      //     items: {
      //       $elemMatch: {
      //         _id: req.params.item_id,
      //         "status.value": {
      //           $in: [
      //             constants.orderStatus.open,
      //             constants.orderStatus.pending,
      //             constants.orderStatus.onHold,
      //             constants.orderStatus.awaitingFulfillment,
      //             constants.orderStatus.awaitingShipment,
      //           ],
      //         },
      //       },
      //     },
      //   },
      //   {
      //     $addToSet: {
      //       "items.$[xxx].status": {
      //         value: constants.orderStatus.cancelled,
      //       },
      //       status: {
      //         value: {
      //           $cond: [
      //             {
      //               $eq: ["val", "val"],
      //             },
      //             constants.orderStatus.cancelled,
      //             constants.orderStatus.outForDelivery,
      //           ],
      //         },
      //       },
      //     },
      //     // $set: {
      //     //   status: {
      //     //     $concatArrays: [
      //     //       {
      //     //         value: {
      //     //           $let: {
      //     //             vars: {
      //     //               statuses: {
      //     //                 $map: {
      //     //                   input: "$items",
      //     //                   as: "item",
      //     //                   in: { $arrayElemAt: ["$$item.status.value", -1] },
      //     //                 },
      //     //               },
      //     //             },
      //     //             in: {
      //     //               $switch: {
      //     //                 branches: [
      //     //                   {
      //     //                     case: {
      //     //                       $eq: [
      //     //                         {
      //     //                           $size: {
      //     //                             $filter: {
      //     //                               input: "$$statuses",
      //     //                               as: "status",
      //     //                               cond: {
      //     //                                 $eq: [
      //     //                                   "$$status",
      //     //                                   constants.orderStatus.cancelled,
      //     //                                 ],
      //     //                               },
      //     //                             },
      //     //                           },
      //     //                         },
      //     //                         {
      //     //                           $size: "$$statuses",
      //     //                         },
      //     //                       ],
      //     //                     },
      //     //                     then: constants.orderStatus.cancelled,
      //     //                   },
      //     //                 ],
      //     //                 default: constants.orderStatus.outForDelivery,
      //     //               },
      //     //             },
      //     //           },
      //     //         },
      //     //       },
      //     //     ],
      //     //   },
      //     // },
      //   },
      //   {
      //     arrayFilters: [
      //       {
      //         "xxx._id": req.params.item_id,
      //       },
      //     ],
      //   }
      // ).then(async (data) => {
      //   return await responseHandler(req, res, message.orderCancelled, data);
      // });
    }
  } catch (err) {
    next(err);
  }
};

const returnOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    res.send("good to go");
  } catch (err) {
    next(err);
  }
};

const rateItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Order.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.id),
          isDeleted: false,
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items._id": new Types.ObjectId(req.params.item_id),
          "items.status.value": constants.orderStatus.completed,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$items.itemId",
        },
      },
    ]);

    if (!data.length) {
      req.files && (await removeImages(req.files));
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      const images: any = [];
      for (let i = 0; i < req.files.length; i++) {
        images.push({
          localUrl: await imageURL(req.headers.host, req.files[i].filename),
        });
      }

      Review.findOneAndUpdate(
        { userId: req.id, productId: data[0].id, isDeleted: false },
        {
          userId: req.id,
          productId: data[0].id,
          description: req.body.description,
          rating: req.body.rating,
          images: images,
          createdBy: req.id,
        },
        { new: true, upsert: true }
      ).then(async (data: any) => {
        if (data) {
          await clearKey(req.params.item_id);
          await clearKey(data.productId);
          return await responseHandler(req, res, message.reviewSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export default {
  createOrder,
  verifyPayment,
  placeOrder,
  orderList,
  detail,
  cancelOrder,
  returnOrder,
  rateItem,
};
