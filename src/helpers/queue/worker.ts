import sendMail from "@/helpers/mail";
import sendMessage from "@/services/messageService";
import { sendNotification } from "@/services/notificationService";
import { Worker } from "bullmq";

//Email Worker
export const emailWorker = new Worker(
  "Email",
  async (job) => {
    await sendMail(job.data);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    limiter: {
      max: 1,
      duration: 2000,
    },
  }
);

//Message Worker
export const messageWorker = new Worker(
  "Message",
  async (job) => {
    await sendMessage(job.data);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    limiter: {
      max: 1,
      duration: 2000,
    },
  }
);

//Notificatin Worker
export const notificationWorker = new Worker(
  "Notification",
  async (job) => {
    await sendNotification(job.data);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    limiter: {
      max: 1,
      duration: 2000,
    },
  }
);
