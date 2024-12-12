import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./pageValidation";
import controller from "./pageController";

router.post(
  `/create-page`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.pageManagement, constants.rights.write),
  validation.create,
  controller.create
);

router.get(
  `/page-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.pageManagement, constants.rights.read),
  validation.pagesList,
  controller.pagesList
);

router.get(
  `/page-detail/:page_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.pageManagement, constants.rights.read),
  validation.detail,
  controller.detail
);

router.put(
  `/update-detail/:page_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.pageManagement, constants.rights.write),
  validation.update,
  controller.update
);

router.put(
  `/manage-page/:page_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.pageManagement, constants.rights.write),
  validation.managePage,
  controller.managePage
);

router.delete(
  `/delete-page`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.pageManagement, constants.rights.delete),
  validation.deletePage,
  controller.deletePage
);

export default router;
