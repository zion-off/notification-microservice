import { Job, Queue, Worker } from "bullmq";
import { QueueType } from "./types";
import { Stats } from "@/utils/window";
import { handler } from "@/utils/handler";
import { emitEmailStats, emitSmsStats, emitQueueSize } from "@/utils/websocket";
import {
  providers,
  options,
  WINDOW_SIZE,
  smsProviderPorts,
  emailProviderPorts,
  DELAY_BASE,
} from "@/utils/config";

// helper function to construct provider endpoint from index
const constructURL = (type: "sms" | "email", provider: number) => {
  const port =
    type === "email"
      ? emailProviderPorts[provider]
      : smsProviderPorts[provider];

  return `http://${process.env.PROVIDER_HOST}:${port}/api/${type}/provider${provider + 1}`;
};

// function to calculate delay based on failed attempts
// with jitter
const calculateDelay = (attempt: number) => {
  return Math.pow(2, attempt) * DELAY_BASE + Math.random() * 100;
};

export const workerCallback = async (job: Job) => {
  const { type, provider, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  try {
    const url = constructURL(type, provider);
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      // log success
      queues[provider].stats.logSuccess();
      console.log("Success");
    } else if (res.status === 500) {
      // log failure
      queues[provider].stats.logFail();
      console.log("Fail");
      // send the job back for retrying
      handler(job.data, queues, type);
      // put queue to sleep and increase delay
      await queues[provider].queue.pause();
      setTimeout(async () => {
        await queues[provider].queue.resume();
      }, calculateDelay(queues[provider].stats.attempts));
    }
  } catch (error) {
    console.log(error.message);
  } finally {
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
  }
};

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
