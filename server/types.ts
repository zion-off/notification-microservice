import { Window } from "@/utils";
import { Queue } from "bullmq";

export type EmailHandlerProps = {
  subject: string;
  body: string;
  recipients: string[];
};

export type SMSHandlerProps = {
  phone: string;
  text: string;
};

export type QueueType = {
  healthy: boolean;
  window: Window;
  queue: Queue;
};
