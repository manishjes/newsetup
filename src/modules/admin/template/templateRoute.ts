import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./templateValidation";
import controller from "./templateController";

router.post(
  `/create-template`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.templateManagement,
    constants.rights.write
  ),
  validation.create,
  controller.create
);

router.get(
  `/template-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.templateManagement,
    constants.rights.read
  ),
  validation.templatesList,
  controller.templatesList
);

router.get(
  `/template-detail/:template_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.templateManagement,
    constants.rights.read
  ),
  validation.detail,
  controller.detail
);

router.put(
  `/update-detail/:template_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.templateManagement,
    constants.rights.write
  ),
  validation.update,
  controller.update
);

router.put(
  `/manage-template/:template_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.templateManagement,
    constants.rights.write
  ),
  validation.manageTemplate,
  controller.manageTemplate
);

router.delete(
  `/delete-template`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(
    constants.privileges.templateManagement,
    constants.rights.delete
  ),
  validation.deleteTemplate,
  controller.deleteTemplate
);

export default router;
