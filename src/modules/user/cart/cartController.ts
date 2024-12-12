import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { billCalculator, createError } from "@/helpers/helper";
import { Types } from "mongoose";
import constants from "@/utils/constants";
import message from "./cartConstant";
import Product from "@/models/product";
import Cart from "@/models/cart";
import Address from "@/models/address";

const addItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Cart.findOne({
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
      const product: any = await Product.findOne({
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
      } else if (product.quantity === 0) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            message.outOfStock
          )
        );
      } else {
        const bill = await billCalculator(product, 1);

        Cart.findOneAndUpdate(
          {
            userId: req.id,
            isDeleted: false,
          },
          {
            userId: req.id,
            $push: {
              items: {
                sellerId: product.userId,
                itemId: product._id,
                tax: {
                  type: product.tax.type,
                  value: product.tax.value,
                },
                mrp: product.mrp,
                sellingPrice: product.sellingPrice,
                taxIncluded: product.taxIncluded,
                quantity: 1,
                total: bill.total,
                discount: bill.discount,
                discountPercent: bill.discountPercent,
                taxableAmount: bill.taxableAmount,
                taxAmount: bill.taxAmount,
                subTotal: bill.subTotal,
                additionalCharge: {
                  shipping: product.additionalCharge.shipping,
                  packaging: product.additionalCharge.packaging,
                },
                netAmount: bill.netAmount,
                status: {
                  value: constants.orderStatus.open,
                  createdOn: Date.now(),
                },
              },
            },
          },
          { upsert: true, new: true }
        ).then(async (data) => {
          if (data) {
            Cart.findOne(
              {
                userId: req.id,
                isDeleted: false,
              },
              {
                total: {
                  $sum: "$items.total",
                },
                discount: {
                  $sum: "$items.discount",
                },
                discountPercent: {
                  $sum: "$items.discountPercent",
                },
                taxableAmount: {
                  $sum: "$items.taxableAmount",
                },
                taxAmount: {
                  $sum: "$items.taxAmount",
                },
                subTotal: {
                  $sum: "$items.subTotal",
                },
                additionalCharge: {
                  shipping: {
                    $sum: "$items.additionalCharge.shipping",
                  },
                  packaging: {
                    $sum: "$items.additionalCharge.packaging",
                  },
                },
                netAmount: {
                  $sum: "$items.netAmount",
                },
              }
            ).then(async (data: any) => {
              if (data) {
                Cart.findOneAndUpdate(
                  {
                    userId: req.id,
                    isDeleted: false,
                  },
                  {
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
                    netAmount: data.netAmount,
                    currency: {
                      code: product.currency.code,
                      symbol: product.currency.symbol,
                    },
                    createdBy: req.id,
                  },
                  { new: true }
                ).then(async (data) => {
                  if (data) {
                    return await responseHandler(req, res, message.itemSuccess);
                  }
                });
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

const cartDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    Cart.aggregate([
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
                from: "brands",
                let: {
                  brandId: "$brandId",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$_id", "$$brandId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                ],
                as: "brand",
              },
            },
            {
              $unwind: {
                path: "$brand",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                let: {
                  userId: "$userId",
                },
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
          items: {
            $push: {
              images: { $first: "$items.item.images" },
              id: "$items.item._id",
              name: "$items.item.name",
              slug: "$items.item.slug",
              SKU: "$items.item.SKU",
              HSN: "$items.item.HSN",
              origin: "$items.item.origin",
              brand: "$items.item.brand.name",
              quantity: "$items.quantity",
              total: "$items.total",
              discount: "$items.discount",
              discountPercent: "$items.discountPercent",
              additionalCharge: "$items.additionalCharge",
              subTotal: "$items.subTotal",
              netAmount: "$items.netAmount",
            },
          },
          shippingAddress: { $first: "$shippingAddress" },
          total: { $first: "$total" },
          discount: { $first: "$discount" },
          discountPercent: { $first: "$discountPercent" },
          additionalCharge: { $first: "$additionalCharge" },
          subTotal: { $first: "$subTotal" },
          netAmount: { $first: "$netAmount" },
          currency: { $first: "$currency" },
          status: { $first: "$status" },
        },
      },
      {
        $addFields: {
          totalItems: { $size: "$items" },
        },
      },
    ]).then(async (data) => {
      if (!data.length) {
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
          message.cartDetailSuccess,
          data[0]
        );
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateQuantity = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Cart.findOne({
      userId: req.id,
      "items.itemId": req.params.item_id,
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
      const product: any = await Product.findOne({
        _id: req.params.item_id,
        isDeleted: false,
      });

      if (!product) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else if (product.quantity === 0) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            message.outOfStock
          )
        );
      } else {
        const bill = await billCalculator(product, Number(req.body.quantity));

        Cart.findOneAndUpdate(
          {
            userId: req.id,
            "items.itemId": product._id,
            isDeleted: false,
          },
          {
            $set: {
              "items.$[xxx].quantity": Number(req.body.quantity),
              "items.$[xxx].total": bill.total,
              "items.$[xxx].discount": bill.discount,
              "items.$[xxx].discountPercent": bill.discountPercent,
              "items.$[xxx].taxableAmount": bill.taxableAmount,
              "items.$[xxx].taxAmount": bill.taxAmount,
              "items.$[xxx].subTotal": bill.subTotal,
              "items.$[xxx].additionalCharge.shipping":
                product.additionalCharge.shipping,
              "items.$[xxx].additionalCharge.packaging":
                product.additionalCharge.packaging,
              "items.$[xxx].netAmount": bill.netAmount,
            },
          },
          {
            arrayFilters: [
              {
                "xxx.itemId": product._id,
              },
            ],
          }
        ).then(async (data) => {
          if (data) {
            Cart.findOne(
              {
                userId: req.id,
                isDeleted: false,
              },
              {
                total: {
                  $sum: "$items.total",
                },
                discount: {
                  $sum: "$items.discount",
                },
                discountPercent: {
                  $sum: "$items.discountPercent",
                },
                taxableAmount: {
                  $sum: "$items.taxableAmount",
                },
                taxAmount: {
                  $sum: "$items.taxAmount",
                },
                subTotal: {
                  $sum: "$items.subTotal",
                },
                additionalCharge: {
                  shipping: {
                    $sum: "$items.additionalCharge.shipping",
                  },
                  packaging: {
                    $sum: "$items.additionalCharge.packaging",
                  },
                },
                netAmount: {
                  $sum: "$items.netAmount",
                },
              }
            ).then(async (data: any) => {
              if (data) {
                Cart.findOneAndUpdate(
                  {
                    userId: req.id,
                    isDeleted: false,
                  },
                  {
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
                    netAmount: data.netAmount,
                    currency: {
                      code: product.currency.code,
                      symbol: product.currency.symbol,
                    },
                    updatedBy: req.id,
                  },
                  { new: true }
                ).then(async (data) => {
                  if (data) {
                    return await responseHandler(
                      req,
                      res,
                      message.cartUpdateSuccess
                    );
                  }
                });
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

const changeAddress = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Address.findOne({
      _id: req.body.address_id,
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
    } else {
      Cart.findOneAndUpdate(
        {
          userId: req.id,
          isDeleted: false,
        },
        {
          shippingAddress: data._id,
          billingAddress: data._id,
          status: constants.cartStatus.inReview,
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.addressChangedSuccess);
        }
      });
    }
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
      const data = await Cart.findOne({
        userId: req.id,
        "items.itemId": req.params.item_id,
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
        Cart.findOneAndUpdate(
          {
            userId: req.id,
            "items.itemId": req.params.item_id,
            isDeleted: false,
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
          if (data) {
            Cart.findOne(
              {
                userId: req.id,
                isDeleted: false,
              },
              {
                total: {
                  $sum: "$items.total",
                },
                discount: {
                  $sum: "$items.discount",
                },
                discountPercent: {
                  $sum: "$items.discountPercent",
                },
                taxableAmount: {
                  $sum: "$items.taxableAmount",
                },
                taxAmount: {
                  $sum: "$items.taxAmount",
                },
                subTotal: {
                  $sum: "$items.subTotal",
                },
                additionalCharge: {
                  shipping: {
                    $sum: "$items.additionalCharge.shipping",
                  },
                  packaging: {
                    $sum: "$items.additionalCharge.packaging",
                  },
                },
                netAmount: {
                  $sum: "$items.netAmount",
                },
              }
            ).then(async (data: any) => {
              if (data) {
                Cart.findOneAndUpdate(
                  {
                    userId: req.id,
                    isDeleted: false,
                  },
                  {
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
                    netAmount: data.netAmount,
                    deletedBy: req.id,
                  },
                  { new: true }
                ).then(async (data) => {
                  if (data) {
                    return await responseHandler(
                      req,
                      res,
                      message.itemDeletedSuccess
                    );
                  }
                });
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

export default {
  addItem,
  cartDetail,
  updateQuantity,
  changeAddress,
  deleteItem,
};
