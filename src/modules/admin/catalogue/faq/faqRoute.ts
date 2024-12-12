import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./faqValidation";
import controller from "./faqController";

router.post(
  `/create-faq`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.faqManagement, constants.rights.write),
  validation.create,
  controller.create
);

router.get(
  `/faq-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.faqManagement, constants.rights.read),
  validation.faqList,
  controller.faqList
);

router.get(
  `/faq-detail/:faq_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.faqManagement, constants.rights.read),
  validation.detail,
  controller.detail
);

router.put(
  `/update-detail/:faq_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.faqManagement, constants.rights.write),
  validation.update,
  controller.update
);

router.delete(
  `/delete-faq`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.faqManagement, constants.rights.delete),
  validation.deleteFAQ,
  controller.deleteFAQ
);

export default router;
