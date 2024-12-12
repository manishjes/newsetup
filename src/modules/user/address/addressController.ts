import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import { clearKey, getOrSetCache } from "@/config/redis";
import { createError, generateAddressSlug } from "@/helpers/helper";
import message from "./addressConstant";
import User from "@/models/user";
import constants from "@/utils/constants";
import Address from "@/models/address";

const create = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await getOrSetCache(req.id, async () => {
      const data = await User.findOne({ _id: req.id });
      return data;
    });

    if (!user) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      Address.countDocuments({
        userId: req.id,
        isDeleted: false,
      }).then(async (data) => {
        if (data === 5) {
          return next(
            await createError(
              constants.code.preconditionFailed,
              message.addressLimit
            )
          );
        } else {
          Address.exists({
            userId: req.id,
            type: req.body.address_type,
            "address.pincode": req.body.pincode,
            isDeleted: false,
          }).then(async (data) => {
            if (data) {
              return next(
                await createError(
                  constants.code.preconditionFailed,
                  message.addressExist
                )
              );
            } else {
              Address.create({
                userId: req.id,
                slug: await generateAddressSlug(
                  req.body.name,
                  req.body.address_type,
                  req.body.pincode
                ),
                type: req.body.address_type,
                name: req.body.name,
                email: user.email.value,
                phone: { isoCode: req.body.iso_code, value: req.body.phone },
                alternatePhone: {
                  isoCode: req.body.iso_code,
                  value: req.body.alternate_phone,
                },
                address: {
                  line_one: req.body.address_line_one,
                  line_two: req.body.address_line_two,
                  city: req.body.city,
                  state: req.body.state,
                  country: req.body.country,
                  pincode: req.body.pincode,
                  latitude: req.body.latitude,
                  longitude: req.body.longitude,
                },
                landmark: req.body.landmark,
                createdBy: req.id,
              }).then(async (data) => {
                if (data) {
                  return await responseHandler(
                    req,
                    res,
                    message.addressSuccess
                  );
                }
              });
            }
          });
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const addressList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Address.find({
      userId: req.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    if (!data.length) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(req, res, message.addressListSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const detail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await getOrSetCache(req.params.address_id, async () => {
      const data = await Address.findOne({
        _id: req.params.address_id,
        userId: req.id,
        isDeleted: false,
      });
      return data;
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else {
      return await responseHandler(
        req,
        res,
        message.addressDetailSuccess,
        data
      );
    }
  } catch (err) {
    next(err);
  }
};

const update = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Address.exists({
      _id: { $nin: [req.params.address_id] },
      userId: req.id,
      type: req.body.address_type,
      "address.pincode": req.body.pincode,
      isDeleted: false,
    });

    if (data) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          message.addressExist
        )
      );
    } else {
      Address.findOneAndUpdate(
        { _id: req.params.address_id },
        {
          slug: await generateAddressSlug(
            req.body.name,
            req.body.address_type,
            req.body.pincode
          ),
          type: req.body.address_type,
          name: req.body.name,
          phone: { isoCode: req.body.iso_code, value: req.body.phone },
          alternatePhone: {
            isoCode: req.body.iso_code,
            value: req.body.alternate_phone,
          },
          address: {
            line_one: req.body.address_line_one,
            line_two: req.body.address_line_two,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            pincode: req.body.pincode,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
          },
          landmark: req.body.landmark,
          updatedBy: req.id,
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          await clearKey(req.params.address_id);
          return await responseHandler(req, res, message.addressUpdateSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.body.is_delete) {
      return next(
        await createError(
          constants.code.preconditionFailed,
          constants.message.invalidType
        )
      );
    } else {
      const data = await Address.find({
        _id: { $in: req.body.address_id },
        userId: req.id,
        isDeleted: false,
      });

      if (!data.length) {
        return next(
          await createError(
            constants.code.dataNotFound,
            constants.message.dataNotFound
          )
        );
      } else {
        Address.updateMany(
          {
            _id: { $in: req.body.address_id },
            userId: req.id,
            isDeleted: false,
          },
          { isDeleted: true, deletedBy: req.id }
        ).then(async (data) => {
          if (data.modifiedCount) {
            for (let i = 0; i < req.body.address_id.length; i++) {
              await clearKey(req.body.address_id[i]);
            }
            return await responseHandler(
              req,
              res,
              message.addressDeletedSuccess
            );
          }
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  addressList,
  detail,
  update,
  deleteAddress,
};
