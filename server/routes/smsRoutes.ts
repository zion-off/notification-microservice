import express, { Request, Response } from "express";
import { handler } from "@/utils/handler";
import { smsQueues } from "@/utils/broker";

const smsRouter = express.Router();

smsRouter.post("/", async (req: Request, res: Response) => {
  const { phone, text } = req.body;
  if (!phone || !text) {
    res.status(400).json({ error: "Invalid request" });
  } else {
    await handler({ phone: phone, text: text }, smsQueues, "sms");
    res.status(200).json();
  }
});

export default smsRouter;
