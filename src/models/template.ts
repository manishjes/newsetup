import { Schema, model } from "mongoose";
import constants from "@/utils/constants";
import { createSlug } from "@/helpers/helper";

const templateSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) =>
        value && value.charAt(0).toUpperCase() + value.slice(1),
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => value.toLowerCase(),
    },
    type: {
      type: String,
      required: true,
      enum: [
        constants.templateType.email,
        constants.templateType.message,
        constants.templateType.notification,
      ],
    },
    templateId: {
      // DLT template ID
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    status: { type: Boolean, required: true, default: true },
    isDeleted: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        ret.createdAt = ret.createdAt && new Date(ret.createdAt).getTime();
        ret.updatedAt = ret.updatedAt && new Date(ret.updatedAt).getTime();
        delete ret.createdBy;
        delete ret.updatedBy;
        delete ret.deletedBy;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Template = model("Template", templateSchema);

Template.find().then(async (data) => {
  if (!data.length) {
    const templates = [
      {
        title: constants.templateTitle.otp,
        slug: await createSlug(constants.templateTitle.otp),
        type: constants.templateType.email,
        subject: "One Time Password | Peak72",
        body: `<table cellpadding="0"
                       cellspacing="0"
                       width="100%"
                       style="
                         mso-table-lspace: 0pt;
                         mso-table-rspace: 0pt;
                         border-collapse: collapse;
                         border-spacing: 0px;
                       "
                     >
                       <tr>
                         <td
                           align="center"
                           valign="top"
                           style="padding: 0; margin: 0; width: 470px"
                         >
                           <table
                             cellpadding="0"
                             cellspacing="0"
                             width="100%"
                             style="
                               mso-table-lspace: 0pt;
                               mso-table-rspace: 0pt;
                               border-collapse: collapse;
                               border-spacing: 0px;
                             "
                           >
                             <tr>
                               <td
                                 align="center"
                                 style="padding: 0; margin: 0"
                               >
                                 <h1
                                   style="
                                     margin: 0;
                                     line-height: 46px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 38px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                   OTP<br />Verification
                                 </h1>
                               </td>
                             </tr>
                             <tr>
                               <td
                                 align="center"
                                 style="
                                   padding: 0;
                                   margin: 0;
                                   padding-top: 20px;
                                   padding-bottom: 20px;
                                 "
                               >
                                  <p
                            style="
                              margin: 0;
                              -webkit-text-size-adjust: none;
                              -ms-text-size-adjust: none;
                              mso-line-height-rule: exactly;
                              font-family: Poppins, sans-serif;
                              line-height: 27px;
                              color: #5d541d;
                              font-size: 18px;
                            "
                          >
                        
                          <table style="margin-top: 10px; font-family: Poppins, sans-serif;color: #5d541d; ">
                          </table>
                                 <h3
                                   style="
                                     margin: 0;
                                     line-height: 24px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 20px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                   Thanks for joining Peak72!
                                 </h3>
                                 <p
                                   style="
                                     margin: 0;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 27px;
                                     color: #ffffff;
                                     font-size: 18px;
                                   "
                                 >
                                   <br />
                                 </p>
                                 <p
                                   style="
                                     margin: 0;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 25px;
                                     color: #ffffff;
                                     font-size: 16px;
                                   "
                                 >
                                   Use the following OTP to complete the
                                   authentication procedure. OTP is valid for
                                   5 minutes.
                                 </p>
                               </td>
                             </tr>
                             <tr>
                               <td
                                 align="center"
                                 style="padding: 0; margin: 0"
                               >
                                 <span
                                   class="msohide es-button-border"
                                   style="
                                     border-style: solid;
                                     border-color: #020a03;
                                     background: #000000;
                                     border-width: 0px;
                                     display: inline-block;
                                     border-radius: 30px;
                                     width: auto;
                                     mso-hide: all;
                                   "
                                 >
                                   <span
                                     style="
                                       mso-style-priority: 100 !important;
                                       text-decoration: none;
                                       -webkit-text-size-adjust: none;
                                       -ms-text-size-adjust: none;
                                       mso-line-height-rule: exactly;
                                       color: #ffffff;
                                       font-size: 16px;
                                       padding: 15px 35px 15px 35px;
                                       display: inline-block;
                                       background: #000000;
                                       border-radius: 30px;
                                       font-family: Poppins, sans-serif;
                                       font-weight: normal;
                                       font-style: normal;
                                       line-height: 19px;
                                       width: auto;
                                       text-align: center;
                                       mso-padding-alt: 0;
                                     "
                                   >
                                     {{payload}}
                                   </span> </span
                                 ><!--<![endif]-->
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
               </table>`,
      },
      {
        title: constants.templateTitle.resetPassword,
        slug: await createSlug(constants.templateTitle.resetPassword),
        type: constants.templateType.email,
        subject: "Reset Password | Peak72",
        body: `<table cellpadding="0"
                       cellspacing="0"
                       width="100%"
                       style="
                         mso-table-lspace: 0pt;
                         mso-table-rspace: 0pt;
                         border-collapse: collapse;
                         border-spacing: 0px;
                       "
                     >
                       <tr>
                         <td
                           align="center"
                           valign="top"
                           style="padding: 0; margin: 0; width: 470px"
                         >
                           <table
                             cellpadding="0"
                             cellspacing="0"
                             width="100%"
                             style="
                               mso-table-lspace: 0pt;
                               mso-table-rspace: 0pt;
                               border-collapse: collapse;
                               border-spacing: 0px;
                             "
                           >
                             <tr>
                               <td
                                 align="center"
                                 style="padding: 0; margin: 0"
                               >
                                 <h1
                                   style="
                                     margin: 0;
                                     line-height: 46px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 38px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                 Password Change<br />Request
                                 </h1>
                               </td>
                             </tr>
                             <tr>
                               <td
                                 align="center"
                                 style="
                                   padding: 0;
                                   margin: 0;
                                   padding-top: 20px;
                                   padding-bottom: 20px;
                                 "
                               >
                                 <h3
                                   style="
                                     margin: 0;
                                     line-height: 24px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 20px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                 You have submitted a password change request.
                                 </h3>
                                 <p
                                   style="
                                     margin: 0;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 27px;
                                     color: #ffffff;
                                     font-size: 18px;
                                   "
                                 >
                                   <br />
                                 </p>
                                 <p
                                   style="
                                     margin: 0;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 25px;
                                     color: #ffffff;
                                     font-size: 16px;
                                   "
                                 >
                                 A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.
                                 </p>
                               </td>
                             </tr>
                             <tr>
                               <td
                                 align="center"
                                 style="padding: 0; margin: 0"
                               >
                                 <span
                                   class="msohide es-button-border"
                                   style="
                                     border-style: solid;
                                     border-color: #020a03;
                                     background: #000000;
                                     border-width: 0px;
                                     display: inline-block;
                                     border-radius: 30px;
                                     width: auto;
                                     mso-hide: all;
                                   "
                                 >
                                   <span
                                     style="
                                       mso-style-priority: 100 !important;
                                       text-decoration: none;
                                       -webkit-text-size-adjust: none;
                                       -ms-text-size-adjust: none;
                                       mso-line-height-rule: exactly;
                                       color: #ffffff;
                                       font-size: 16px;
                                       padding: 15px 35px 15px 35px;
                                       display: inline-block;
                                       background: #000000;
                                       border-radius: 30px;
                                       font-family: Poppins, sans-serif;
                                       font-weight: normal;
                                       font-style: normal;
                                       line-height: 19px;
                                       width: auto;
                                       text-align: center;
                                       mso-padding-alt: 0;
                                     "
                                   >
                                     {{payload}}
                                   </span> </span
                                 ><!--<![endif]-->
                               </td>
                             </tr>
                           </table>
                         </td>
                       </tr>
               </table>`,
      },
      {
        title: constants.templateTitle.credential,
        slug: await createSlug(constants.templateTitle.credential),
        type: constants.templateType.email,
        subject: "Your Credentials | Peak72",
        body: `<table cellpadding="0"
                       cellspacing="0"
                       width="100%"
                       style="
                         mso-table-lspace: 0pt;
                         mso-table-rspace: 0pt;
                         border-collapse: collapse;
                         border-spacing: 0px;
                       "
                     >
                       <tr>
                         <td
                           align="center"
                           valign="top"
                           style="padding: 0; margin: 0; width: 470px"
                         >
                           <table
                             cellpadding="0"
                             cellspacing="0"
                             width="100%"
                             style="
                               mso-table-lspace: 0pt;
                               mso-table-rspace: 0pt;
                               border-collapse: collapse;
                               border-spacing: 0px;
                             "
                           >
                             <tr>
                               <td
                                 align="center"
                                 style="padding: 0; margin: 0"
                               >
                                 <h1
                                   style="
                                     margin: 0;
                                     line-height: 46px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 38px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                 Hello, {{payload.name}}<br />
                                 </h1>
                               </td>
                             </tr>
                             <tr>
                               <td
                                 align="center"
                                 style="
                                   padding: 0;
                                   margin: 0;
                                   padding-top: 20px;
                                   padding-bottom: 0px;
                                 "
                               >
                                 <h3
                                   style="
                                     margin: 0;
                                     line-height: 24px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 20px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                 Greetings from Peak72!
                                 </h3>
                                 <p
                                   style="
                                     margin-top: 10px;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 25px;
                                     color: #ffffff;
                                     font-size: 16px;
                                   "
                                 >
                                 Your account has been created successfully.
                                 </p>
                               </td>
                             </tr>
                           </table>
                           <table style="margin-top: 0px; font-family: Poppins, sans-serif;color: #ffffff; ">
                            <tr>
                              <th style="text-align: right; vertical-align: top;">Username/Email:</th>
                              <td>{{payload.email}}</td>
                            </tr>
                            <tr>
                              <th style="text-align: right; vertical-align: top;">Password:</th>
                              <td style="font-weight: lighter;">Your account password is your First name's initial which will be in Capital followed by @ and your Birth year. (Ex. John@1989 )</td>
                            </tr>
                           </table>
                         </td>
                       </tr>
              </table>`,
      },
      {
        title: constants.templateTitle.orderConfirmation,
        slug: await createSlug(constants.templateTitle.orderConfirmation),
        type: constants.templateType.email,
        subject: "Order Confirmation | Peak72",
        body: `<table cellpadding="0"
                       cellspacing="0"
                       width="100%"
                       style="
                         mso-table-lspace: 0pt;
                         mso-table-rspace: 0pt;
                         border-collapse: collapse;
                         border-spacing: 0px;
                       "
                     >
                       <tr>
                         <td
                           align="center"
                           valign="top"
                           style="padding: 0; margin: 0; width: 470px"
                         >
                           <table
                             cellpadding="0"
                             cellspacing="0"
                             width="100%"
                             style="
                               mso-table-lspace: 0pt;
                               mso-table-rspace: 0pt;
                               border-collapse: collapse;
                               border-spacing: 0px;
                             "
                           >
                             <tr>
                               <td
                                 align="center"
                                 style="padding: 0; margin: 0"
                               >
                                 <h1
                                   style="
                                     margin: 0;
                                     line-height: 46px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 25px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                   "
                                 >
                                 Thank you for the order!
                                 </h1>
                               </td>
                             </tr>
                             <tr>
                               <td
                                 align="center"
                                 style="
                                   padding: 0;
                                   margin: 0;
                                   padding-top: 10px;
                                   padding-bottom: 0px;
                                 "
                               >
                                 <h3
                                   style="
                                     margin: 0;
                                     line-height: 24px;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     font-size: 15px;
                                     font-style: normal;
                                     font-weight: bold;
                                     color: #ffffff;
                                     text-align: left;
                                   "
                                 >
                                 Hello, {{payload.name}}<br />
                                 </h3>
                                 <p
                                   style="
                                     margin-top: 10px;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 20px;
                                     color: #ffffff;
                                     font-size: 14px;
                                     text-align: left;
                                   "
                                 >
                                 We appreciate you selecting Peak72 as your learning partner. We are pleased to notify you that we are processing your order and have successfully received it.
                                 </p>
                                 <p
                                   style="
                                     margin-top: 0px;
                                     -webkit-text-size-adjust: none;
                                     -ms-text-size-adjust: none;
                                     mso-line-height-rule: exactly;
                                     font-family: Poppins, sans-serif;
                                     line-height: 25px;
                                     color: #ffffff;
                                     font-size: 14px;
                                     text-align: left;
                                   "
                                 >
                                 Your order information is displayed below.
                                 </p>
                               </td>
                             </tr>
                           </table>
                           <table width="100%" style="margin-top: 0px; font-family: Poppins, sans-serif; border: 1px solid black;color: #ffffff; ">
                            <tr>
                              <th style="color: white; text-align: left;">Order details:</th>
                            </tr>
                            <tr>
                              <th align="left" style="padding-top: 10px; color: white;">
                                Order No:</th>
                              <th align="left" style="padding-top:10px; color: white;">
                                Order date:</th>
                            </tr>
                            <tr>
                              <td align="left" style="color: white;">
                               #OD12892382379438493489</td>
                              <td align="left" style="color: white;">
                                October 5, 2024</td>
                            </tr>
                            <tr>
                              <td colspan="2"> <hr style="opacity: .4;"/></td>
                            </tr>
                            <!-- <tr>
                              <th style="text-align: right;">Password:</th>
                              <td style="font-weight: lighter;">Your account password is your First name's initial which will be in Capital followed by @ and your Birth year. (Ex. John@1989 )</td>
                            </tr> -->
                           </table>
                         </td>
                       </tr>
                </table>`,
      },
      {
        title: constants.templateTitle.otp,
        slug: await createSlug(constants.templateTitle.otp),
        type: constants.templateType.message,
        templateId: "",
        body: `Project Name: {{payload.otp}} is your verification code. DO NOT SHARE this code with anyone.`,
      },
      {
        title: constants.templateTitle.orderConfirmation,
        slug: await createSlug(constants.templateTitle.orderConfirmation),
        type: constants.templateType.notification,
        body: `Your order placed successfully.`,
      },
      {
        title: constants.templateTitle.lifeRefill,
        slug: await createSlug(constants.templateTitle.lifeRefill),
        type: constants.templateType.notification,
        body: `Your life refill successfully.`,
      },
      {
        title: constants.templateTitle.orderShipped,
        slug: await createSlug(constants.templateTitle.orderShipped),
        type: constants.templateType.notification,
        body: `Your order shipped successfully.`,
      },
      {
        title: constants.templateTitle.streakPending,
        slug: await createSlug(constants.templateTitle.streakPending),
        type: constants.templateType.notification,
        body: `Hi {{payload.name}} complete your today's streak.`,
      },
    ];
    await Template.insertMany(templates);
  }
});

export default Template;
