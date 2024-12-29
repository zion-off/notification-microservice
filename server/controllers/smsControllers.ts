import { Request, Response } from "express";
import { sendSmsService } from "@/services/smsServices";

export const sendSmsController = async (req: Request, res: Response) => {
  try {
    const { phone, text } = req.body;
    await sendSmsService({ phone, text });
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
