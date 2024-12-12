import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./userValidation";
import controller from "./userController";

router.post(
  `/register`,
  accessRateLimiter,
  checkAccessKey,
  validation.register,
  controller.register
);

router.post(
  `/login`,
  accessRateLimiter,
  checkAccessKey,
  validation.login,
  controller.login
);

router.get(
  `/get-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.getDetail
);

router.put(
  `/change-picture`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.changePicture,
  controller.changePicture
);

router.put(
  `/update-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.updateDetail,
  controller.updateDetail
);

router.post(
  `/verify-email`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.verifyEmail,
  controller.verifyEmail
);

router.post(
  `/verify-phone`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.verifyPhone,
  controller.verifyPhone
);

router.put(
  `/update-email`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.updateEmail,
  controller.updateEmail
);

router.put(
  `/update-phone`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.updatePhone,
  controller.updatePhone
);

router.put(
  `/manage-authentication`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.manageAuthentication,
  controller.manageAuthentication
);

router.put(
  `/manage/push/notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.manageNotification,
  controller.managePushNotification
);

router.put(
  `/manage/email/notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.manageNotification,
  controller.manageEmailNotification
);

router.put(
  `/manage/message/notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.manageNotification,
  controller.manageMessageNotification
);

router.post(
  `/deactivate-account`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.deactivateAccount,
  controller.deactivateAccount
);

router.delete(
  `/delete-account`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.deleteAccount,
  controller.deleteAccount
);

router.post(
  `/logout`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.logout
);

router.post(
  `/logout-all`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.logoutFromAll
);


router.get(
  `/badges-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.badgesList
);

router.post(
  `/google-login`,
  accessRateLimiter,
  checkAccessKey,
  validation.googlelogin,
  controller.googleLogin
);



router.post(
  `/contect`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.contectList
);

export default router;
