import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./notificationValidation";
import controller from "./notificationController";

router.get(
  `/notification-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.notificationList,
  controller.notificationList
);

router.post(
  `/read-notification/:notification_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.readNotification,
  controller.readNotification
);

router.delete(
  `/delete-notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.deleteNotification,
  controller.deleteNotification
);

export default router;
