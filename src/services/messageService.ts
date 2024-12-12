import axios from "axios";
import { compile } from "handlebars";
import { logger } from "@/helpers/logger";
import Template from "@/models/template";
import { createSlug } from "@/helpers/helper";
import constants from "@/utils/constants";

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

const sendMessage = async (payload: any) => {
  try {
    const data: any = await Template.findOne({
      slug: await createSlug(payload.title),
      type: constants.templateType.message,
    });

    // const params: any = {
    //   apikey: process.env.MESSAGE_API_KEY,
    //   senderid: process.env.MESSAGE_SENDER_ID,
    //   templateid: data.templateId,
    //   number: payload.to.replace(/[+]/g, ""),
    //   message: await addPayload(data.body, payload.data),
    // };

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      //   url: process.env.MESSAGE_SERVICE_URL,
      url: `https://2factor.in/API/V1/9a55e3fb-9fe8-11ef-8b17-0200cd936042/SMS/${payload.to.replace(
        /[+]/g,
        ""
      )}/${payload.data}/OTP1`,
      headers: {
        "Content-Type": "application/json",
      },
      //   params: params,
    };

    return axios
      .request(config)
      .then((response: any) => {
        return true;
      })
      .catch((err: any) => {
        logger.error(err);
      });
  } catch (err) {
    logger.error(err);
  }
};

export default sendMessage;
