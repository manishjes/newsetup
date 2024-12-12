import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./reviewValidation";
import controller from "./reviewController";

router.get(
  `/review-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.reviewManagement, constants.rights.read),
  validation.reviewsList,
  controller.reviewsList
);

router.get(
  `/review-detail`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.reviewManagement, constants.rights.read),
  validation.detail,
  controller.detail
);

router.delete(
  `/delete-review`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.reviewManagement,
    constants.rights.delete
  ),
  validation.deleteReview,
  controller.deleteReview
);

export default router;
