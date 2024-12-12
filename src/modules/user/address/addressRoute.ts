import { Router } from "express";
const router = Router({ caseSensitive: true, strict: false });
import accessRateLimiter from "@/middlewares/accessRateLimiter";
import checkAccessKey from "@/middlewares/checkAccessKey";
import checkAuth from "@/middlewares/checkAuth";
import validation from "./addressValidation";
import controller from "./addressController";

router.post(
  `/add-address`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.create,
  controller.create
);

router.get(
  `/address-list`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  controller.addressList
);

router.get(
  `/address-detail/:address_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.detail,
  controller.detail
);

router.put(
  `/update-detail/:address_id`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.update,
  controller.update
);

router.delete(
  `/delete-address`,
  accessRateLimiter,
  checkAccessKey,
  checkAuth.User,
  validation.deleteAddress,
  controller.deleteAddress
);

export default router;
