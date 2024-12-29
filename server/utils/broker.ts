import { Job, Queue, Worker } from "bullmq";
import { QueueType } from "./types";
import { Stats } from "@/utils/window";
import { handler } from "@/utils/handler";
import { constructURL, calculateDelay, emit } from "@/utils/helpers";
import {
  providers,
  QUEUE_OPTIONS,
  WORKER_OPTIONS,
  WINDOW_SIZE,
} from "@/utils/config";

export const processor = async (job: Job) => {
  const { type, provider, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  const queue = type === "email" ? emailQueues[provider] : smsQueues[provider];
  console.log(`Worker pulled job ${job.id} from queue ${provider}.`);
  let res: Response;
  try {
    const url = await constructURL(type, provider);
    res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      console.log(
        `Worker successfully completed job ${job.id} in queue ${provider}`
      );
      // log success
      queue.stats.logSuccess();
    } else if (res.status === 500) {
      console.log(`Worker failed to do job ${job.id} in queue ${provider}`);
      // log failure
      console.log(`Job ${job.id} in provider ${provider} failed`);
      queue.stats.logFail();
      // send the job back for retrying
      const otherQueues = queues.filter((_, i) => i !== provider);
      await handler(payload, otherQueues, type);
      // put queue to sleep and increase delay
      await queue.queue.pause();
      setTimeout(async () => {
        await queue.queue.resume();
      }, calculateDelay(queue.stats.attempts));
    } else {
      const responseText = await res.text();
      throw new Error(
        `Job ${job.id} failed with status ${res.status} (${res.statusText}). Response: ${responseText}`
      );
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    emit(queues, type, res.ok, payload);
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
    queue: new Queue(`sms-${provider}`, QUEUE_OPTIONS),
  };
});

export const emailQueues: QueueType[] = providers.map((provider) => {
  return {
    stats: new Stats(WINDOW_SIZE),
    queue: new Queue(`email-${provider}`, QUEUE_OPTIONS),
  };
});

// workers are consumers that process jobs from the queue
// worker constructor takes in three arguments
// i) queue name (1-1 mapping of queue and worker),
// ii) a callback that tells the worker what to do
// iii) some additional options
const smsWorkers = providers.map((provider) => {
  return new Worker(`email-${provider}`, processor, WORKER_OPTIONS);
});

const emailWorkers = providers.map((provider) => {
  return new Worker(`sms-${provider}`, processor, WORKER_OPTIONS);
});
