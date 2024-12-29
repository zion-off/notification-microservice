import { Stats } from "@/utils/window";
import { Queue } from "bullmq";

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
  provider: number;
  payload: SMSType | EmailType;
};
