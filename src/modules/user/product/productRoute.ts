import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./productValidation";
import controller from "./productController";

router.get(
  `/product-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.productList,
  controller.productList
);

router.get(
  `/product-detail/:product_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.detail
);

export default router;
