import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./planValidation";
import controller from "./planController";

router.post(
  `/create-plan`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.planManagement, constants.rights.write),
  validation.create,
  controller.create
);

router.get(
  `/plan-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.planManagement, constants.rights.read),
  validation.plansList,
  controller.plansList
);

router.get(
  `/plan-detail/:plan_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.planManagement, constants.rights.read),
  validation.detail,
  controller.detail
);

router.put(
  `/update-detail/:plan_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.planManagement, constants.rights.write),
  validation.update,
  controller.update
);

router.put(
  `/manage-plan/:plan_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.planManagement, constants.rights.write),
  validation.managePlan,
  controller.managePlan
);

router.delete(
  `/delete-plan`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.planManagement, constants.rights.delete),
  validation.deletePlan,
  controller.deletePlan
);

export default router;
