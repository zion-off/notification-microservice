import express, { Request, Response } from "express";
import { handler } from "@/utils/handler";
import { emailQueues } from "@/utils/broker";

const emailRouter = express.Router();

emailRouter.post("/", async (req: Request, res: Response) => {
  const { subject, body, recipients } = req.body;
  if (!subject || !body || !recipients) {
    res.status(400).json({ error: "Invalid request" });
  } else {
    await handler({ subject, body, recipients }, emailQueues, "email");
    res.status(200).json();
  }
});

export default emailRouter;