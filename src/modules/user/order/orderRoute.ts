import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import { handleImagesUpload } from "@/middlewares/multer";
import validation from "./orderValidation";
import controller from "./orderController";

router.post(
  `/create-order`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.createOrder,
  controller.createOrder
);

router.post(
  `/verify-payment`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.verifyPayment,
  controller.verifyPayment
);

router.post(
  `/place-order`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.placeOrder,
  controller.placeOrder
);

router.get(
  `/order-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.orderList,
  controller.orderList
);

router.get(
  `/order-detail/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.detail
);

router.post(
  `/generate-invoice/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail
  // controller.generateInvoice
);

router.post(
  `/cancel-order/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.cancelOrder
);

router.post(
  `/return-order/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.returnOrder
);

router.put(
  `/rate-item/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  handleImagesUpload,
  validation.rateItem,
  controller.rateItem
);

export default router;
