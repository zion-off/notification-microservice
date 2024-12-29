import {
  smsProviderPorts,
  emailProviderPorts,
  DELAY_BASE,
  MAX_DELAY,
} from "@/utils/config";
import { emitEmailStats, emitSmsStats, emitQueueSize } from "@/utils/websocket";
import { QueueType } from "./types";

// helper function to construct provider endpoint from index
export const constructURL = (type: "sms" | "email", provider: number) => {
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
  console.log(
    `Calculated delay ${delay}, returning ${Math.min(delay, MAX_DELAY)}`
  );
  return Math.min(delay, MAX_DELAY);
};

// send stats to any connected clients
export const emit = async (queues: QueueType[], type: "email" | "sms") => {
  const queueStats = await Promise.all(
    queues.map(async (provider) => {
      const jobCounts = await provider.queue.getJobCounts();
      return Object.values(jobCounts);
    })
  );
  if (type === "sms") {
    emitSmsStats();
    emitQueueSize("sms", queueStats.flat());
  } else if (type === "email") {
    emitEmailStats();
    emitQueueSize("email", queueStats.flat());
  }
};
