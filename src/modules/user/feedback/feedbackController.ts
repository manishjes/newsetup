import { Request, Response, NextFunction } from "express";
import { responseHandler } from "@/middlewares/handler";
import message from "./feedbackConstant";
import Feedback from "@/models/feedback";

const giveFeedback = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await Feedback.findOneAndUpdate(
      { userId: req.id, type: req.body.feedback_type },
      {
        userId: req.id,
        type: req.body.feedback_type,
        reason: req.body.reason,
        description: req.body.description,
        rating: req.body.rating,
        createdBy: req.id,
      },
      { new: true, upsert: true }
    );

    if (data) {
      return await responseHandler(req, res, message.feedbackSuccess);
    }
  } catch (err) {
    next(err);
  }
};

export default {
  giveFeedback,
};
