import { Router } from "express";
const router = Router({ caseSensitive: true, strict: true });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./adminValidation";
import controller from "./adminController";
import { handlePictureUpload } from "@/middlewares/multer";

router.post(
  `/login`,
  accessRateLimiter,
  checkAccessKey,
  validation.login,
  controller.login
);

router.post(
  `/login/otp`,
  accessRateLimiter,
  checkAccessKey,
  validation.loginWithOTP,
  controller.loginWithOTP
);

router.get(
  `/get-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  controller.getDetail
);

router.put(
  `/change-picture`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  handlePictureUpload,
  validation.changePicture,
  controller.changePicture
);

router.put(
  `/update-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.updateDetail,
  controller.updateDetail
);

router.post(
  `/verify-email`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.verifyEmail,
  controller.verifyEmail
);

router.post(
  `/verify-phone`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.verifyPhone,
  controller.verifyPhone
);

router.put(
  `/update-email`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.updateEmail,
  controller.updateEmail
);

router.put(
  `/update-phone`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.updatePhone,
  controller.updatePhone
);

router.put(
  `/change-password`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.changePassword,
  controller.changePassword
);

router.put(
  `/manage-authentication`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.manageAuthentication,
  controller.manageAuthentication
);

router.put(
  `/manage/push/notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.manageNotification,
  controller.managePushNotification
);

router.put(
  `/manage/email/notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.manageNotification,
  controller.manageEmailNotification
);

router.put(
  `/manage/message/notification`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.manageNotification,
  controller.manageMessageNotification
);

router.post(
  `/deactivate-account`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.deactivateAccount,
  controller.deactivateAccount
);

router.delete(
  `/delete-account`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  validation.deleteAccount,
  controller.deleteAccount
);

router.post(
  `/logout`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  controller.logout
);

router.post(
  `/logout-all`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  controller.logoutFromAll
);

router.post(
  `/forgot-password`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.forgotPassword,
  controller.forgotPassword
);

router.put(
  `/reset-password`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.resetPassword,
  controller.resetPassword
);

export default router;
