import { Queue } from "bullmq";

//Email Queue
export const emailQueue = new Queue("Email", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

//Message Queue
export const messageQueue = new Queue("Message", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

//Notification Queue
export const notificationQueue = new Queue("Notification", {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});
