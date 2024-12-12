import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./publicValidation";
import controller from "./publicController";

router.post(
  `/getAccessKey`,
  accessRateLimiter,
  validation.getAccessKey,
  controller.getAccessKey
);

router.post(
  `/send-otp`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.sendOTP,
  controller.sendOTP
);

router.post(
  `/send-otp/message`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.sendMessageOTP,
  controller.sendMessageOTP
);

router.post(
  `/send-otp/mail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.sendMailOTP,
  controller.sendMailOTP
);

router.post(
  `/verify-otp`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.verifyOTP,
  controller.verifyOTP
);

router.post(
  `/availability/email`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.emailAvailability,
  controller.emailAvailability
);

router.post(
  `/availability/phone`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.phoneAvailability,
  controller.phoneAvailability
);

router.post(
  `/availability/username`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.usernameAvailability,
  controller.usernameAvailability
);

router.get(
  `/country-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  controller.countryList
);

router.get(
  `/state-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.stateList,
  controller.stateList
);

router.get(
  `/city-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.cityList,
  controller.cityList
);

router.post(
  `/locality-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.localityDetail,
  controller.localityDetail
);

router.get(
  `/locality-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.localityDetail,
  controller.localityDetail
);

router.get(
  `/maintenance-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  controller.maintenanceDetail
);

router.get(
  `/skill-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.skillList,
  controller.skillList
);


router.get(
  `/category-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Public,
  validation.categoryList,
  controller.categoryList
);

export default router;
