import { Job, Queue, Worker } from "bullmq";
import { QueueType } from "./types";
import { Stats } from "@/utils/window";
import { handler } from "@/utils/handler";
import { constructURL, calculateDelay, emit } from "@/utils/helpers";
import { providers, options, WINDOW_SIZE } from "@/utils/config";

export const processor = async (job: Job) => {
  const { id, type, provider, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  const queue = type === "email" ? emailQueues[provider] : smsQueues[provider];
  console.log(
    `Worker pulled job ${id} from queue ${provider}: ${JSON.stringify(
      job.data,
      null,
      2
    )}`
  );
  try {
    const url = await constructURL(type, provider);
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      console.log(
        `Worker successfully completed job ${id} in queue ${provider}`
      );
      // log success
      queue.stats.logSuccess();
    } else if (res.status === 500) {
      console.log(`Worker failed to do job ${id} in queue ${provider}`);
      // log failure
      console.log(`Job ${id} in provider ${provider} failed`);
      queue.stats.logFail();
      // send the job back for retrying
      const otherQueues = queues.filter((_, i) => i !== provider);
      await handler(id, job.data.payload, otherQueues, type);
      // put queue to sleep and increase delay
      await queue.queue.pause();
      setTimeout(async () => {
        await queue.queue.resume();
      }, calculateDelay(queue.stats.attempts));
    } else {
      const responseText = await res.text();
      throw new Error(
        `Job ${id} failed with status ${res.status} (${res.statusText}). Response: ${responseText}`
      );
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    emit(queues, type);
  }
};

// debug processor
const debugProcessor = async (job: Job) => {
  try {
    console.log(`Processing job #${job.id}, job data: ${job.data}`);
  } catch (error) {
    console.error(error);
  } finally {
    console.log(`Finished processing job #${job.id}`);
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
const smsWorkers = providers.map((provider) => {
  return new Worker(`email-${provider}`, processor, options);
});

const emailWorkers = providers.map((provider) => {
  return new Worker(`sms-${provider}`, processor, options);
});
