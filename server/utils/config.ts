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
  maxStalledCount: 3,
};

export const JOB_OPTIONS: JobsOptions = {
  attempts: 3, // provider failures are handled by the handler, this is just to retry if queueing fails
  removeOnComplete: true, // removes successful job from the queue
  removeOnFail: true,
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

// initial priority order for email and sms
export const initialEmailPriority = [
  {
    id: 1,
    provider_type: "email",
    provider_name: "Gmail",
    provider_key: "goog",
    priority: 1,
  },
  {
    id: 2,
    provider_type: "email",
    provider_name: "Outlook",
    provider_key: "msft",
    priority: 2,
  },
  {
    id: 3,
    provider_type: "email",
    provider_name: "Yahoo",
    provider_key: "yhoo",
    priority: 3,
  },
];

export const initialSmsPriority = [
  {
    id: 1,
    provider_type: "sms",
    provider_name: "GrameenPhone",
    provider_key: "gp",
    priority: 1,
  },
  {
    id: 2,
    provider_type: "sms",
    provider_name: "BanglaLink",
    provider_key: "bl",
    priority: 2,
  },
  {
    id: 3,
    provider_type: "sms",
    provider_name: "Robi",
    provider_key: "robi",
    priority: 3,
  },
];
