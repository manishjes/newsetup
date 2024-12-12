import { logger } from "@/helpers/logger";
import { emailWorker, messageWorker, notificationWorker } from "./worker";

const queues = async () => {
  // Email queue
  emailWorker.on("completed", async (job) => {
    // logger.info(job.id);
  });
  emailWorker.on("failed", (job, err) => {
    logger.error(err);
  });

  // Message queue
  messageWorker.on("completed", async (job) => {
    // logger.info(job.id)
  });
  messageWorker.on("failed", (job, err) => {
    logger.error(err);
  });

  // Notification queue
  notificationWorker.on("completed", async (job) => {
    // logger.info(job.id)
  });
  notificationWorker.on("failed", (job, err) => {
    logger.error(err);
  });
};

export default queues;
