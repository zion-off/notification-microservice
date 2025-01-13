import dotenv from "dotenv";
import { JobsOptions, QueueOptions, WorkerOptions } from "bullmq";
dotenv.config();

// import server and redis config from env
export const { SERVER_PORT, REDIS_HOST, REDIS_PORT } = process.env;

// options for bullmq
export const QUEUE_OPTIONS: QueueOptions = {
  connection: { host: REDIS_HOST, port: Number(REDIS_PORT) },
};

export const WORKER_OPTIONS: WorkerOptions = {
  connection: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
  },
  limiter: {
    max: 1,
    duration: 1000,
  },
};

export const JOB_OPTIONS: JobsOptions = {
  attempts: 1, // retries are handled by the handler, so 1 attempt is sufficient
  removeOnComplete: true, // removes successful job from the queue
  removeOnFail: true, // removes failed job from queue
};

// for tracking success/error of last N requests
export const WINDOW_SIZE = 100;

// 100ms base for exponential backoff
export const DELAY_BASE = 10;

// max delay
export const MAX_DELAY = 100;

// if failure:success ratio greater than this,
// flag provider as unhealthy, and vice versa
export const UNHEALTHY_THRESHOLD = 0.7;
export const HEALTHY_THRESHOLD =
  Math.round((UNHEALTHY_THRESHOLD / 3) * 10) / 10;

// names for mapping providers to queues
export const providers = ["provider-one", "provider-two", "provider-three"];

// ports at which providers are running
export const smsProviderPorts = [8071, 8072, 8073];
export const emailProviderPorts = [8091, 8092, 8093];
