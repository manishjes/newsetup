import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./wishlistValidation";
import controller from "./wishlistController";

router.post(
  `/add-item`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.addItem,
  controller.addItem
);

router.get(
  `/wish-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.wishList,
  controller.wishList
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
