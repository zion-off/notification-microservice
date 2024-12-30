import { Job, Queue, Worker } from "bullmq";
import { QueueType, JobType } from "./types";
import { Stats } from "@/utils/window";
import { handler } from "@/utils/handler";
import { constructURL, calculateDelay, emit } from "@/utils/helpers";
import {
  providers,
  QUEUE_OPTIONS,
  WORKER_OPTIONS,
  WINDOW_SIZE,
} from "@/utils/config";
import { ClientError, ServerError } from "./errors";
import { Provider } from "@/utils/provider";

export const processor = async (job: Job<JobType>) => {
  const { type, provider, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  const queue = type === "email" ? emailQueues[provider] : smsQueues[provider];
  const service =
    type === "email" ? emailProviders[provider] : smsProviders[provider];

  console.log(`Worker pulled job ${job.id} from queue ${provider}`);
  let success: boolean;
  try {
    success = await service.send(payload);
    if (success) {
      console.log(
        `Worker successfully completed job ${job.id} in queue ${provider}`
      );
      // log success
      queue.stats.logSuccess();
    }
  } catch (error) {
    if (error instanceof ServerError) {
      console.log(`Worker failed to do job ${job.id} in queue ${provider}`);
      // log failure
      queue.stats.logFail();
      // send the job back for retrying
      const otherQueues = queues.filter((_, i) => i !== provider);
      await handler(payload, otherQueues, type);
      // put queue to sleep and increase delay
      await queue.queue.pause();
      setTimeout(async () => {
        await queue.queue.resume();
      }, calculateDelay(queue.stats.attempts));
    } else if (error instanceof ClientError) {
      console.log(`Job ${job.id} failed, ${error.message}, ${error.details}`);
    } else {
      console.error(`Unexpected error during job ${job.id}:`, error);
    }
  } finally {
    emit(queues, type, success, payload);
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

// providers
const smsProviders = providers.map((_, index) => {
  return Provider.createProvider("sms", index);
});

const emailProviders = providers.map((_, index) => {
  return Provider.createProvider("email", index);
});
