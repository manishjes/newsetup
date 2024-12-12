import { Request, Response, NextFunction } from "express";
import { createError, createSlug, getRenewalDate } from "@/helpers/helper";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import constants from "@/utils/constants";
import message from "./subscriptionConstant";
import Subscription from "@/models/subscription";
import Payment from "@/models/payment";
import Plan from "@/models/plan";
import User from "@/models/user";

const purchaseSubscription = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: any = await Subscription.findOne({
      planId: req.body.plan_id,
      userId: req.id,
      status: true,
      isDeleted: false,
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.alreadyActive
        )
      );
    } else {
      const plan: any = await Plan.findOne({
        _id: req.body.plan_id,
        status: true,
        isDeleted: false,
      });

      if (!plan) {
        return next(
          await createError(
            constants.code.preconditionFailed,
            message.invalidPlanId
          )
        );
      } else {
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
          Subscription.create({
            subscriptionId: payment.orderNumber,
            userId: req.id,
            planId: plan._id,
            renewalDate: await getRenewalDate(plan.recurringCycle),
          }).then((subscription) => {
            if (subscription) {
              User.findOneAndUpdate(
                {
                  _id: req.id,
                  isDeleted: false,
                },
                {
                  isPremium: true,
                },
                {
                  new: true,
                }
              ).then(async (data) => {
                return await responseHandler(
                  req,
                  res,
                  message.subscriptionSuccess
                );
              });
            }
          });
        }
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  purchaseSubscription,
};
