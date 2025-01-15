import { Stats } from "@/utils/window";
import { Job, Queue } from "bullmq";
import { ServerError, ClientError } from "./errors";

export type QueueType = {
  stats: Stats; // stats class keeps track of provider health
  queue: Queue; // bullmq Queue instance for storing jobs
};

export type SMSType = {
  phone: string;
  text: string;
};

export type EmailType = {
  subject: string;
  body: string;
  recipients: string[];
};

export type JobType = {
  type: "sms" | "email";
  providerIndex: number;
  payload: SMSType | EmailType;
};

export type JobFailHandlerArgs = {
  error: ServerError | ClientError | Error;
  job: Job<JobType>;
  providerIndex: number;
  queue: QueueType;
  type: "sms" | "email";
  payload: EmailType | SMSType;
};
