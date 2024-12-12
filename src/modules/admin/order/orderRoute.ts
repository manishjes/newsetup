import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import checkPrivilege from "@/middlewares/checkPrivilege";
import constants from "@/utils/constants";
import validation from "./orderValidation";
import controller from "./orderController";

router.get(
  `/order-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.orderManagement, constants.rights.read),
  validation.orderList,
  controller.orderList
);

router.get(
  `/order-detail/:order_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.orderManagement, constants.rights.read),
  validation.detail,
  controller.detail
);

router.put(
  `/manage-order/:order_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.Admin,
  checkPrivilege(constants.privileges.orderManagement, constants.rights.write),
  validation.manageOrder,
  controller.manageOrder
);

export default router;
