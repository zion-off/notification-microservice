import express, { Request, Response, NextFunction } from "express";
import { Queue, Worker } from "bullmq";
import { Window } from "@/utils";
import { workerCallback } from "@/worker";
import { handler } from "@/handler";
import { providers, options, SERVER_PORT, WINDOW_SIZE } from "@/config";

// create queues for sms and email providers
export const smsQueues = providers.map((provider) => {
  return {
    healthy: true,
    window: new Window(WINDOW_SIZE),
    queue: new Queue(`sms-${provider}`, options),
  };
});

export const emailQueues = providers.map((provider) => {
  return {
    healthy: true,
    window: new Window(WINDOW_SIZE),
    queue: new Queue(`email-${provider}`, options),
  };
});

// create consumers to request providers
const smsWorkers = providers.map((_, index) => {
  return new Worker(smsQueues[index].queue.name, workerCallback, options);
});

const emailWorkers = providers.map((_, index) => {
  return new Worker(emailQueues[index].queue.name, workerCallback, options);
});

const app = express();
app.use(express.json());

// middleware to handle errors thrown by request parser
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

// register sms route
app.post("/api/sms", async (req: Request, res: Response) => {
  const { phone, text } = req.body;
  if (!phone || !text) {
    res.status(400).json({ error: "Invalid request" });
  } else {
    await handler({ phone: phone, text: text }, smsQueues, "sms");
    res.status(200).json();
  }
});

// register email route
app.post("/api/email", async (req: Request, res: Response) => {
  const { subject, body, recipients } = req.body;
  if (!subject || !body || !recipients) {
    res.status(400).json({ error: "Invalid request" });
  } else {
    await handler({ subject, body, recipients }, emailQueues, "email");
    res.status(200).json();
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});
