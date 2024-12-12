import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError } from "@/helpers/helper";
import constants from "@/utils/constants";
import message from "./orderConstant";
import Order from "@/models/order";
import { Types } from "mongoose";

const orderList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const skip = page * limit;
    const sort = req.query.sort === "desc" ? -1 : 1;
    const data = limit !== 0 ? [{ $skip: skip }, { $limit: limit }] : [];

    Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
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
          as: "placedBy",
        },
      },
      {
        $unwind: {
          path: "$placedBy",
          preserveNullAndEmptyArrays: true,
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
          from: "payments",
          localField: "orderId",
          foreignField: "orderNumber",
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
                status: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: ["$status", constants.paymentStatus.pending],
                        },
                        then: "Pending",
                      },
                      {
                        case: {
                          $eq: ["$status", constants.paymentStatus.paid],
                        },
                        then: "Paid",
                      },
                      {
                        case: {
                          $eq: ["$status", constants.paymentStatus.failed],
                        },
                        then: "Failed",
                      },
                    ],
                  },
                },
              },
            },
          ],
          as: "payment",
        },
      },
      {
        $addFields: {
          status: { $last: "$status" },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          orderId: 1,
          items: { $size: "$items" },
          orderDate: { $toLong: "$orderDate" },
          placedBy: 1,
          currency: 1,
          netAmount: 1,
          status: {
            value: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.open],
                    },
                    then: "Open",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.pending],
                    },
                    then: "Pending",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.onHold],
                    },
                    then: "On Hold",
                  },
                  {
                    case: {
                      $eq: [
                        "$status.value",
                        constants.orderStatus.awaitingFulfillment,
                      ],
                    },
                    then: "Awaiting Fulfillment",
                  },
                  {
                    case: {
                      $eq: [
                        "$status.value",
                        constants.orderStatus.awaitingShipment,
                      ],
                    },
                    then: "Awaiting Shipment",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.shipped],
                    },
                    then: "Shipped",
                  },
                  {
                    case: {
                      $eq: [
                        "$status.value",
                        constants.orderStatus.partiallyShipped,
                      ],
                    },
                    then: "Partially Shipped",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.inTransit],
                    },
                    then: "In Transit",
                  },
                  {
                    case: {
                      $eq: [
                        "$status.value",
                        constants.orderStatus.outForDelivery,
                      ],
                    },
                    then: "Out For Delivery",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.completed],
                    },
                    then: "Completed",
                  },
                  {
                    case: {
                      $eq: [
                        "$status.value",
                        constants.orderStatus.partiallyCompleted,
                      ],
                    },
                    then: "Partially Completed",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.cancelled],
                    },
                    then: "Cancelled",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.returned],
                    },
                    then: "Returned",
                  },
                  {
                    case: {
                      $eq: ["$status.value", constants.orderStatus.refund],
                    },
                    then: "Refunded",
                  },
                ],
              },
            },
            updatedOn: { $toLong: "$status.updatedOn" },
          },
          paymentStatus: { $last: "$payment.status" },
        },
      },
      {
        $sort: { orderDate: sort },
      },
      {
        $match: {
          $and: [
            {
              $or: [
                {
                  orderId: {
                    $regex: "^" + req.query.search + ".*",
                    $options: "i",
                  },
                },
                {
                  "placedBy.name.firstName": {
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
            {
              ...(req.query.filter.paymentStatus
                ? {
                    paymentStatus: req.query.filter.paymentStatus,
                  }
                : {}),
            },
          ],
        },
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

const detail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.order_id, async () => {
      const data = await Order.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(req.params.order_id),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
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
                  photo: 1,
                },
              },
            ],
            as: "placedBy",
          },
        },
        {
          $unwind: {
            path: "$placedBy",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "orderId",
            foreignField: "orderNumber",
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
                  paymentMode: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $eq: [
                              "$paymentMode",
                              constants.paymentMode.prepaid,
                            ],
                          },
                          then: "Prepaid",
                        },
                        {
                          case: {
                            $eq: [
                              "$paymentMode",
                              constants.paymentMode.postpaid,
                            ],
                          },
                          then: "Postpaid",
                        },
                      ],
                    },
                  },
                  currency: 1,
                  amount: 1,
                  paymentMethod: 1,
                  paymentDate: { $toLong: "$paymentDate" },
                  status: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $eq: ["$status", constants.paymentStatus.pending],
                          },
                          then: "Pending",
                        },
                        {
                          case: {
                            $eq: ["$status", constants.paymentStatus.paid],
                          },
                          then: "Paid",
                        },
                        {
                          case: {
                            $eq: ["$status", constants.paymentStatus.failed],
                          },
                          then: "Failed",
                        },
                      ],
                    },
                  },
                },
              },
            ],
            as: "payment",
          },
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
                  email: 1,
                  phone: 1,
                  alternatePhone: 1,
                  address: 1,
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
          $lookup: {
            from: "addresses",
            localField: "billingAddress",
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
                  email: 1,
                  phone: 1,
                  alternatePhone: 1,
                  address: 1,
                },
              },
            ],
            as: "billingAddress",
          },
        },
        {
          $unwind: {
            path: "$billingAddress",
            preserveNullAndEmptyArrays: true,
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
                $project: {
                  _id: 0,
                  id: "$_id",
                  images: { $first: "$images" },
                  name: 1,
                  SKU: 1,
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
          $group: {
            _id: "$_id",
            items: {
              $push: {
                id: "$items._id",
                name: "$items.item.name",
                images: "$items.item.images",
                sku: "$items.item.SKU",
                tax: "$items.tax",
                mrp: "$items.mrp",
                sellingPrice: "$items.sellingPrice",
                taxIncluded: "$items.taxIncluded",
                quantity: "$items.quantity",
                total: "$items.total",
                discount: "$items.discount",
                discountPercent: "$items.discountPercent",
                taxableAmount: "$items.taxableAmount",
                taxAmount: "$items.taxAmount",
                subTotal: "$items.subTotal",
                additionalCharge: "$items.additionalCharge",
                netAmount: "$items.netAmount",
                status: {
                  $last: {
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
                                then: "Open",
                              },
                              {
                                case: {
                                  $eq: [
                                    "$$status.value",
                                    constants.orderStatus.pending,
                                  ],
                                },
                                then: "Pending",
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
                                then: "Awaiting Fulfillment",
                              },
                              {
                                case: {
                                  $eq: [
                                    "$$status.value",
                                    constants.orderStatus.awaitingShipment,
                                  ],
                                },
                                then: "Awaiting Shipment",
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
                                    constants.orderStatus.partiallyShipped,
                                  ],
                                },
                                then: "Partially Shipped",
                              },
                              {
                                case: {
                                  $eq: [
                                    "$$status.value",
                                    constants.orderStatus.inTransit,
                                  ],
                                },
                                then: "In Transit",
                              },
                              {
                                case: {
                                  $eq: [
                                    "$$status.value",
                                    constants.orderStatus.outForDelivery,
                                  ],
                                },
                                then: "Out For Delivery",
                              },
                              {
                                case: {
                                  $eq: [
                                    "$$status.value",
                                    constants.orderStatus.completed,
                                  ],
                                },
                                then: "Completed",
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
                                then: "Refunded",
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
            orderId: { $first: "$orderId" },
            shippingAddress: { $first: "$shippingAddress" },
            billingAddress: { $first: "$billingAddress" },
            orderType: { $first: "$orderType" },
            orderDate: { $first: "$orderDate" },
            total: { $first: "$total" },
            discount: { $first: "$discount" },
            discountPercent: { $first: "$discountPercent" },
            taxableAmount: { $first: "$taxableAmount" },
            taxAmount: { $first: "$taxAmount" },
            subTotal: { $first: "$subTotal" },
            additionalCharge: { $first: "$additionalCharge" },
            netAmount: { $first: "$netAmount" },
            currency: { $first: "$currency" },
            status: { $first: "$status" },
            placedBy: { $first: "$placedBy" },
            payment: { $first: "$payment" },
          },
        },
        {
          $addFields: {
            status: { $last: "$status" },
          },
        },
        {
          $project: {
            _id: 0,
            id: "$_id",
            items: 1,
            orderId: 1,
            orderType: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: ["$orderType", constants.orderType.online],
                    },
                    then: "Online",
                  },
                  {
                    case: {
                      $eq: ["$orderType", constants.orderType.self],
                    },
                    then: "Self",
                  },
                ],
              },
            },
            orderDate: { $toLong: "$orderDate" },
            total: 1,
            discount: 1,
            discountPercent: 1,
            taxableAmount: 1,
            taxAmount: 1,
            subTotal: 1,
            additionalCharge: 1,
            netAmount: 1,
            currency: 1,
            shippingAddress: 1,
            billingAddress: 1,
            placedBy: 1,
            payment: { $last: "$payment" },
            transaction: "$payment",
            status: {
              value: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.open],
                      },
                      then: "Open",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.pending],
                      },
                      then: "Pending",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.onHold],
                      },
                      then: "On Hold",
                    },
                    {
                      case: {
                        $eq: [
                          "$status.value",
                          constants.orderStatus.awaitingFulfillment,
                        ],
                      },
                      then: "Awaiting Fulfillment",
                    },
                    {
                      case: {
                        $eq: [
                          "$status.value",
                          constants.orderStatus.awaitingShipment,
                        ],
                      },
                      then: "Awaiting Shipment",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.shipped],
                      },
                      then: "Shipped",
                    },
                    {
                      case: {
                        $eq: [
                          "$status.value",
                          constants.orderStatus.partiallyShipped,
                        ],
                      },
                      then: "Partially Shipped",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.inTransit],
                      },
                      then: "In Transit",
                    },
                    {
                      case: {
                        $eq: [
                          "$status.value",
                          constants.orderStatus.outForDelivery,
                        ],
                      },
                      then: "Out For Delivery",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.completed],
                      },
                      then: "Completed",
                    },
                    {
                      case: {
                        $eq: [
                          "$status.value",
                          constants.orderStatus.partiallyCompleted,
                        ],
                      },
                      then: "Partially Completed",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.cancelled],
                      },
                      then: "Cancelled",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.returned],
                      },
                      then: "Returned",
                    },
                    {
                      case: {
                        $eq: ["$status.value", constants.orderStatus.refund],
                      },
                      then: "Refunded",
                    },
                  ],
                },
              },
              updatedOn: { $toLong: "$status.updatedOn" },
            },
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

const manageOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = {
      cancel: constants.orderStatus.cancelled,
      onHold: constants.orderStatus.onHold,
      accept: constants.orderStatus.pending,
      shipped: constants.orderStatus.shipped,
      completed: constants.orderStatus.completed,
      returned:constants.orderStatus.returned,
      refund: constants.orderStatus.refund
      
    };

    Order.findOneAndUpdate(
      {
        _id: req.params.order_id,
        isDeleted: false,
        "status.value": {
          $nin: [
            Object.values(status)[Object.keys(status).indexOf(req.body.status)],
          ],
        },
      },
      {
        $addToSet: {
          status: {
            value:
              Object.values(status)[
                Object.keys(status).indexOf(req.body.status)
              ],
          },
          "items.$[].status": {
            value:
              Object.values(status)[
                Object.keys(status).indexOf(req.body.status)
              ],
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
        await clearKey(req.params.order_id);

        const messages = {
          cancel: message.orderCancelSuccess,
          onHold: message.orderDraftSuccess,
          accept: message.orderAcceptSuccess,
          shipped: message.oderShippedSuccess,
          completed:message.oderCompletedSuccess,
          returned: message.oderReturnedSuccess,
          refund:message.oderRefundSuccess
        };

        return await responseHandler(
          req,
          res,
          Object.values(messages)[
            Object.keys(messages).indexOf(req.body.status)
          ]
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

export default {
  orderList,
  detail,
  manageOrder,
};
