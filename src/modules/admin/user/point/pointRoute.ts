import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./pointValidation";
import controller from "./pointController";

router.get(
  `/point-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.userManagement, constants.rights.read),
  validation.pointsList,
  controller.pointsList
);

export default router;
