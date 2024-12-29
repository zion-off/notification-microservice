import {
  smsProviderPorts,
  emailProviderPorts,
  DELAY_BASE,
  MAX_DELAY,
} from "@/utils/config";
import {
  emitEmailStats,
  emitSmsStats,
  emitQueueSize,
  emitEmailResult,
  emitSmsResult,
} from "@/utils/websocket";
import { QueueType, SMSType, EmailType } from "./types";

// helper function to construct provider endpoint from index
export const constructURL = async (type: "sms" | "email", provider: number) => {
  const port =
    type === "email"
      ? emailProviderPorts[provider]
      : smsProviderPorts[provider];

  return `http://${process.env.PROVIDER_HOST}:${port}/api/${type}/provider${
    provider + 1
  }`;
};

// function to calculate delay based on failed attempts
// with jitter
export const calculateDelay = (attempt: number) => {
  const delay = Math.pow(2, attempt) * DELAY_BASE + Math.random() * 100;
  return Math.min(delay, MAX_DELAY);
};

// send stats to any connected clients
export const emit = async (
  queues: QueueType[],
  type: "email" | "sms",
  success: boolean,
  payload: SMSType | EmailType
) => {
  const queueStats: number[] = await Promise.all(
    queues.map(async (provider) => {
      const jobCounts = await provider.queue.getJobCounts();
      const totalJobCount = Object.values(jobCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      console.log(totalJobCount);
      return totalJobCount;
    })
  );
  if (type === "sms") {
    emitSmsStats();
    emitQueueSize("sms", queueStats);
    emitSmsResult(payload as SMSType, success);
  } else if (type === "email") {
    emitEmailStats();
    emitQueueSize("email", queueStats);
    emitEmailResult(payload as EmailType, success);
  }
};
