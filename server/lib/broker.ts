import chalk from "chalk";
import { Job, Queue, Worker } from "bullmq";
import { QueueType, JobType } from "../utils/types";
import { Stats } from "@/utils/window";
import { emit as emitStatsToSocket } from "@/utils/helpers";
import { Provider } from "@/utils/provider";
import {
  emailProviders,
  smsProviders,
  QUEUE_OPTIONS,
  WORKER_OPTIONS,
  WINDOW_SIZE,
} from "@/utils/config";
import { jobFailHandler } from "@/lib/jobFailHandler";

export const processor = async (job: Job<JobType>) => {
  const { type, providerIndex, history, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  const queue =
    type === "email" ? emailQueues[providerIndex] : smsQueues[providerIndex];
  const selectedProvider =
    type === "email"
      ? emailProvidersArray[providerIndex]
      : smsProvidersArray[providerIndex];

  console.log(
    chalk.bgGrey.black("STATUS "),
    `Worker pulled ${type.toUpperCase()}-${job.id} from ${queue.queue.name}`
  );
  let successFlag: boolean;
  try {
    successFlag = await selectedProvider.send(payload);
    if (successFlag) {
      console.log(
        chalk.black.bgGreen("SUCCESS"),
        `Worker successfully sent ${type.toUpperCase()}-${job.id} from ${
          queue.queue.name
        }`
      );
      // log success
      queue.stats.logSuccess();
    }
  } catch (error) {
    await jobFailHandler({
      error,
      job,
      history,
      queue,
      type,
      payload,
    });
  } finally {
    emitStatsToSocket(queues, type, successFlag, payload);
  }
};

// wrappers around bullmq Queue instances
// the Stats class keeps track of provider health
// based on last WINDOW_SIZE requests
// Queue is the actual bullmq Queue instance
// constructor takes in the name of the Queue and some options
export const smsQueues: QueueType[] = smsProviders.map((provider) => {
  const { provider_name } = provider;
  return {
    stats: new Stats(WINDOW_SIZE),
    queue: new Queue(`${provider_name.toLowerCase()}-queue`, QUEUE_OPTIONS),
  };
});

export const emailQueues: QueueType[] = emailProviders.map((provider) => {
  const { provider_name } = provider;
  return {
    stats: new Stats(WINDOW_SIZE),
    queue: new Queue(`${provider_name.toLowerCase()}-queue`, QUEUE_OPTIONS),
  };
});

// workers are consumers that process jobs from the queue
// worker constructor takes in three arguments
// i) queue name (1-1 mapping of queue and worker),
// ii) a callback that tells the worker what to do
// iii) some additional options
const smsWorkers = smsProviders.map((provider) => {
  const { provider_name } = provider;
  return new Worker(
    `${provider_name.toLowerCase()}-queue`,
    processor,
    WORKER_OPTIONS
  );
});

const emailWorkers = emailProviders.map((provider) => {
  const { provider_name } = provider;
  return new Worker(
    `${provider_name.toLowerCase()}-queue`,
    processor,
    WORKER_OPTIONS
  );
});

// providers
const smsProvidersArray = smsProviders.map((item, index) => {
  const { provider_name } = item;
  return Provider.createProvider("sms", index, provider_name.toLowerCase());
});

const emailProvidersArray = emailProviders.map((item, index) => {
  const { provider_name } = item;
  return Provider.createProvider("email", index, provider_name.toLowerCase());
});
