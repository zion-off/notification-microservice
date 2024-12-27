import express, { Request, Response, NextFunction } from "express";
import { Queue, Worker } from "bullmq";
import { QueueType } from "./types";
import { Stats } from "@/utils";
import { workerCallback } from "@/worker";
import { handler } from "@/handler";
import { providers, options, SERVER_PORT, WINDOW_SIZE } from "@/config";

// wrappers around bullmq Queue instances
// the Stats class keeps track of provider health
// based on last WINDOW_SIZE requests
// Queue is the actual bullmq Queue instance
// constructor takes in the name of the Queue and some options
export const smsQueues: QueueType[] = providers.map((provider) => {
  return {
    stats: new Stats(WINDOW_SIZE),
    queue: new Queue(`sms-${provider}`, options),
  };
});

export const emailQueues: QueueType[] = providers.map((provider) => {
  return {
    stats: new Stats(WINDOW_SIZE),
    queue: new Queue(`email-${provider}`, options),
  };
});

// workers are consumers that process jobs from the queue
// worker constructor takes in three arguments
// i) queue name (1-1 mapping of queue and worker),
// ii) a callback that tells the worker what to do
// iii) some additional options
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
