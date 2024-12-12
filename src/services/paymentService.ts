import Razorpay from "razorpay";
import crypto from "node:crypto";
import { logger } from "@/helpers/logger";
import { generateRefNumber } from "@/helpers/helper";

const createOrderId = async (amount: number) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: await generateRefNumber(),
    };

    const data = await instance.orders.create(options);

    return {
      order_id: data.id,
      currency: data.currency,
      amount: data.amount,
    };
  } catch (err) {
    logger.error(err);
  }
};

const validatePayment = async (data: any) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const body = data.order_id + "|" + data.payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", `${process.env.KEY_SECRET}`)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === data.signature) {
      return instance.payments
        .fetch(data.payment_id)
        .then((data) => {
          return data;
        })
        .catch((err) => {
          return false;
        });
    } else {
      return instance.payments
        .fetch(data.payment_id)
        .then((data) => {
          return data;
        })
        .catch((err) => {
          logger.error(err);
          return false;
        });
    }
  } catch (err) {
    logger.error(err);
  }
};

export { createOrderId, validatePayment };
