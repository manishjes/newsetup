import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import {
  createError,
  getFileName,
  logoURL,
  removeLogo,
} from "@/helpers/helper";
import message from "./settingConstant";
import Setting from "@/models/setting";
import constants from "@/utils/constants";

const getDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await Setting.findOne({ isDeleted: false });
    if (data) {
      return await responseHandler(req, res, message.detailSuccess, data);
    }
  } catch (err) {
    next(err);
  }
};

const changeLogo = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data: any = await Setting.findOne({
      isDeleted: false,
    });

    if (!data) {
      return next(
        await createError(
          constants.code.dataNotFound,
          constants.message.dataNotFound
        )
      );
    } else if (!data.application.logo.localUrl) {
      Setting.findOneAndUpdate(
        { isDeleted: false },
        {
          "application.logo.localUrl": await logoURL(
            req.headers.host,
            req.file.filename
          ),
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.logoSuccess);
        }
      });
    } else {
      await removeLogo(await getFileName(data.application.logo.localUrl));
      Setting.findOneAndUpdate(
        { isDeleted: false },
        {
          "application.logo.localUrl": await logoURL(
            req.headers.host,
            req.file.filename
          ),
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.logoSuccess);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

const updateDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    Setting.findOneAndUpdate(
      { isDeleted: false },
      {
        $set: {
          "application.name": req.body.application_name,
          "application.organization.name": req.body.organization.name,
          "application.organization.CIN": req.body.organization.cin,
          "application.organization.GST": req.body.organization.gst,
          "application.organization.PAN": req.body.organization.gst,
          "application.organization.address.lineOne":
            req.body.organization.address.line_one,
          "application.organization.address.lineTwo":
            req.body.organization.address.line_two,
          "application.organization.address.city":
            req.body.organization.address.city,
          "application.organization.address.state":
            req.body.organization.address.state,
          "application.organization.address.country":
            req.body.organization.address.country,
          "application.organization.address.pincode":
            req.body.organization.address.pincode,
          "application.country.name": req.body.country.name,
          "application.country.code": req.body.country.code,
          "application.timezone.name": req.body.timezone.name,
          "application.timezone.format": req.body.timezone.format,
          "application.language.name": req.body.language.name,
          "application.language.code": req.body.language.code,
          "application.currency.code": req.body.currency.code,
          "application.currency.symbol": req.body.currency.symbol,
          "application.dateFormat": req.body.date_format,
          "application.timeFormat": req.body.time_format,
          "application.weekStartsOn": req.body.week_start_on,
          "application.socialLinks.twitter.link": req.body.social_link.twitter,
          "application.socialLinks.facebook.link":
            req.body.social_link.facebook,
          "application.socialLinks.instagram.link":
            req.body.social_link.instagram,
          "application.socialLinks.youtube.link": req.body.social_link.youtube,
          "application.socialLinks.linkedin.link":
            req.body.social_link.linkedin,
          "application.socialLinks.github.link": req.body.social_link.github,
          "application.socialLinks.pinterest.link":
            req.body.social_link.pinterest,
        },
      },
      { new: true }
    ).then(async (data) => {
      if (data) {
        return await responseHandler(req, res, message.detailUpdateSuccess);
      }
    });
  } catch (err) {
    next(err);
  }
};

const manageMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.status) {
      Setting.findOneAndUpdate(
        { isDeleted: false },
        {
          $set: {
            maintenance: {
              $unset: { time: 1 },
              status: req.body.status,
            },
          },
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.maintenanceOff);
        }
      });
    } else {
      Setting.findOneAndUpdate(
        { isDeleted: false },
        {
          $set: {
            maintenance: {
              time: req.body.time,
              status: req.body.status,
            },
          },
        },
        { new: true }
      ).then(async (data) => {
        if (data) {
          return await responseHandler(req, res, message.maintenanceOn);
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export default {
  getDetail,
  changeLogo,
  updateDetail,
  manageMaintenance,
};
