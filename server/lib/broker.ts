import { Job, Queue, Worker } from "bullmq";
import { QueueType, JobType } from "../utils/types";
import { Stats } from "@/utils/window";
import { emit as emitStatsToSocket } from "@/utils/helpers";
import { Provider } from "@/utils/provider";
import {
  providers,
  QUEUE_OPTIONS,
  WORKER_OPTIONS,
  WINDOW_SIZE,
} from "@/utils/config";
import { jobFailHandler } from "@/lib/jobFailHandler";

export const processor = async (job: Job<JobType>) => {
  const { type, providerIndex, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  const queue =
    type === "email" ? emailQueues[providerIndex] : smsQueues[providerIndex];
  const selectedProvider =
    type === "email"
      ? emailProviders[providerIndex]
      : smsProviders[providerIndex];

  console.log(`Worker pulled job ${job.id} from queue ${providerIndex}`);
  let successFlag: boolean;
  try {
    successFlag = await selectedProvider.send(payload);
    if (successFlag) {
      console.log(
        `Worker successfully completed job ${job.id} in queue ${providerIndex}`
      );
      // log success
      queue.stats.logSuccess();
    }
  } catch (error) {
    await jobFailHandler({ error, job, providerIndex, queue, type, payload });
  } finally {
    emitStatsToSocket(queues, type, successFlag, payload);
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
