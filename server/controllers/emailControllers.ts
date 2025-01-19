import { Request, Response } from "express";
import { sendEmailService } from "@/services/emailServices";

export const sendEmailController = async (req: Request, res: Response) => {
  try {
    const { subject, body, recipients } = req.body;
    await sendEmailService({ subject, body, recipients });
    res.status(200).json({message: "Email queued successfully"});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
