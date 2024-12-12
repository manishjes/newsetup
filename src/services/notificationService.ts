import admin from "firebase-admin";
const serviceAccount = require("../config/keys/peak72finance.json");
import { logger } from "@/helpers/logger";
import Template from "@/models/template";
import { createSlug } from "@/helpers/helper";
import constants from "@/utils/constants";
import { compile } from "handlebars";
import Device from "@/models/device";
import Notification from "@/models/notification";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const addPayload = async (data: any, payload: any) => {
  try {
    const context = {
      payload: payload,
    };

    const template = compile(data);
    return template(context);
  } catch (err) {
    logger.error(err);
  }
};

const sendNotification = async (payload: any) => {
  try {
    const device: any = await Device.findOne({
      userId: payload.to,
      deviceToken: { $ne: null },
      isDeleted: false,
    });

    const data: any = await Template.findOne({
      slug: await createSlug(payload.title),
      type: constants.templateType.notification,
    });

    const message: any = {
      data: {
        title: data.title,
        body: await addPayload(data.body, payload.data),
      },
      token: device && device.deviceToken,
    };

    return (
      device &&
      admin
        .messaging()
        .send(message)
        .then(async (response) => {
          await Notification.findOneAndUpdate(
            {
              userId: payload.to,
              isDeleted: false,
            },
            {
              $push: {
                notifications: {
                  message: message.data.body,
                },
              },
            },
            { new: true, upsert: true }
          );
          return true;
        })
        .catch((error) => {
          logger.error(error);
          return false;
        })
    );
  } catch (err) {
    logger.error(err);
  }
};

export { sendNotification };
