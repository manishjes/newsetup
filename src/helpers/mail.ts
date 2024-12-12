import { createTransport } from "nodemailer";
import { compile } from "handlebars";
import { readFileSync } from "fs";
import { logger } from "@/helpers/logger";
import Template from "@/models/template";
import { createSlug } from "@/helpers/helper";
import constants from "@/utils/constants";

const generateHtml = async (data: any) => {
  try {
    const context = {
      body: data,
    };
    const content = readFileSync("public/templates/mail.html", "utf8");
    const template = compile(content);
    return template(context);
  } catch (err) {
    logger.error(err);
  }
};

const addPayload = async (data: any, payload: any) => {
  try {
    const context = {
      payload: payload,
    };

    const template = compile(await generateHtml(data));
    return template(context);
  } catch (err) {
    logger.error(err);
  }
};

const addSubjectPayload = async (data: any, payload: any) => {
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

const sendMail = async (payload: any) => {
  const transporter = createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    secure: true,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const data: any = await Template.findOne({
    slug: await createSlug(payload.title),
    type: constants.templateType.email,
  });

  if (data) {
    const mailOptions = {
      from: `Peak72 ${process.env.SMTP_USER}`,
      to: payload.to,
      subject: await addSubjectPayload(data.subject, payload.data),
      cc: payload.cc,
      html: await addPayload(data.body, payload.data),
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        logger.error(error);
      } else {
        return true;
      }
    });
  }
};

export default sendMail;
