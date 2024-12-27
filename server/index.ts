import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { Queue, Worker, Job } from "bullmq";
import { SMSHandlerProps, EmailHandlerProps, QueueType } from "@/types";
import { Window } from "@/utils";

const HEALTHY_THRESHOLD = 10;
const WINDOW_SIZE = 500;

dotenv.config();
const { REDIS_HOST, REDIS_PORT } = process.env;

// define bullmq queue options
const options = {
  connection: { host: REDIS_HOST, port: Number(REDIS_PORT) },
};

// names for mapping providers to queues
const providers = ["provider-one", "provider-two", "provider-three"];
// define provider ports
const smsProviderPorts = [8071, 8072, 8073];
const emailProviderPorts = [8091, 8092, 8093];

// create queues for sms and email providers
const smsQueues = providers.map((provider) => {
  return {
    healthy: true,
    window: new Window(WINDOW_SIZE),
    queue: new Queue(`sms-${provider}`, options),
  };
});

const emailQueues = providers.map((provider) => {
  return {
    healthy: true,
    window: new Window(WINDOW_SIZE),
    queue: new Queue(`email-${provider}`, options),
  };
});

// create consumers to request providers
const smsWorkers = providers.map((_, index) => {
  return new Worker(
    smsQueues[index].queue.name,
    async (job: Job) => {
      try {
        console.log("Sending SMS with provider %d", index, "on port", smsProviderPorts[index])
        const res = await fetch(
          `localhost:${smsProviderPorts[index]}/api/sms/provider${index+1}`,
          {
            method: "POST",
            body: JSON.stringify(job.data),
          }
        );
        if (res.ok) {
          smsQueues[index].window.success();
          console.log("Success")
        }
      } catch (error) {
        smsQueues[index].window.fail();
        handler(job.data, smsQueues, "SMS");
        if (smsQueues[index].window.getFailCount() > HEALTHY_THRESHOLD) {
          smsQueues[index].healthy = false;
        }
        console.log("Fail", error.message)
      }
    },
    options
  );
});

const emailWorkers = providers.map((_, index) => {
  return new Worker(
    emailQueues[index].queue.name,
    async (job: Job) => {
      try {
        const res = await fetch(
          `localhost:${emailProviderPorts[index]}/api/email/provider${index+1}`,
          {
            method: "POST",
            body: JSON.stringify(job.data),
          }
        );
        if (res.ok) {
          smsQueues[index].window.success();
        }
      } catch (error) {
        smsQueues[index].window.fail();
        handler(job.data, smsQueues, "Email");
        if (smsQueues[index].window.getFailCount() > HEALTHY_THRESHOLD) {
          smsQueues[index].healthy = false;
        }
      }
    },
    options
  );
});

// handler to produce / enque jobs
async function handler<T>(job: T, queues: QueueType[], type: string) {
  let provider = -1,
    healthy = false;
  while (!healthy) {
    provider = Math.floor(Math.random() * queues.length);
    if (queues[provider].healthy) healthy = true;
  }
  await queues[provider].queue.add(`Send ${type}`, job);
}

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
    await handler({ phone, text }, smsQueues, "SMS");
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

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running on port ${process.env.SERVER_PORT}`);
});
