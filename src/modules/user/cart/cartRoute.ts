import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./cartValidation";
import controller from "./cartController";

router.post(
  `/add-item`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.addItem,
  controller.addItem
);

router.get(
  `/cart-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.cartDetail
);

router.put(
  `/update-quantity/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.updateQuantity,
  controller.updateQuantity
);

router.put(
  `/change-address`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.changeAddress,
  controller.changeAddress
);

router.delete(
  `/delete-item/:item_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.deleteItem,
  controller.deleteItem
);

export default router;
