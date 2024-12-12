import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./feedbackValidation";
import controller from "./feedbackController";

router.post(
  `/give-feedback`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.feedbackManagement,
    constants.rights.write
  ),
  validation.giveFeedback,
  controller.giveFeedback
);

router.get(
  `/feedback-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.feedbackManagement,
    constants.rights.read
  ),
  validation.feedbacksList,
  controller.feedbacksList
);

router.delete(
  `/delete-feedback`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.feedbackManagement,
    constants.rights.delete
  ),
  validation.deleteFeedback,
  controller.deleteFeedback
);

export default router;
