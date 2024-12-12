import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./subscriptionValidation";
import controller from "./subscriptionController";

router.post(
  `/purchase-subscription`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.purchaseSubscription,
  controller.purchaseSubscription
);

export default router;
