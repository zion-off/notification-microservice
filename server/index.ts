import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { Queue, Worker, Job } from "bullmq";
import { EmailHandlerProps } from "@/types";

dotenv.config();
const { REDIS_HOST, REDIS_PORT } = process.env;

// define bullmq queue options
const options = {
  connection: { host: REDIS_HOST, port: Number(REDIS_PORT) },
};

// names for mapping providers to queues
const providers = ["provider-one", "provider-two", "provider-three"];

// create queues for sms and email providers
const smsQueues = providers.map(
  (provider) => new Queue(`sms-${provider}`, options)
);
const emailQueues = providers.map(
  (provider) => new Queue(`email-${provider}`, options)
);

// create consumers to request providers
const smsWorkers = providers.map((_, index) => {
  return new Worker(
    smsQueues[index].name,
    async (job: Job) => {
      console.log(`Sending SMS with provider ${index}`);
      console.log(job.data.subject);
      console.log(job.data.body);
      console.log(job.data.recipients);
    },
    options
  );
});

const emailWorkers = providers.map((_, index) => {
  return new Worker(
    emailQueues[index].name,
    async (job: Job) => {
      console.log(`Sending email with provider ${index}`);
      console.log(job.data.subject);
      console.log(job.data.body);
      console.log(job.data.recipients);
    },
    options
  );
});

function smsHandler() {}

async function emailHandler(EmailJob: EmailHandlerProps) {
  const provider = Math.floor(Math.random() * emailQueues.length);
  await emailQueues[provider].add("Send Email", EmailJob);
}

const app = express();
app.use(express.json());

// register sms route
app.post("/api/sms", (req: Request, res: Response) => {});

// register email route
app.post("/api/email", async (req: Request, res: Response) => {
  const { subject, body, recipients } = req.body;
  await emailHandler({ subject, body, recipients });
  res.status(200).json({ message: "Email processed successfully" });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running on port ${process.env.SERVER_PORT}`);
});
