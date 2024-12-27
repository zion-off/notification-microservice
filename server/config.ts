import dotenv from "dotenv";
dotenv.config();

// import server and redis config from env
export const { SERVER_PORT, REDIS_HOST, REDIS_PORT } = process.env;

// options for bullmq
export const options = {
  connection: { host: REDIS_HOST, port: Number(REDIS_PORT) },
};

// for tracking success/error ratio of last N requests
export const WINDOW_SIZE = 5;

// 100ms base for exponential backoff
export const DELAY_BASE = 100;

// if failure:success ratio greater than this,
// flag provider as unhealthy, and vice versa
export const FAILURE_THRESHOLD = 0.7

// names for mapping providers to queues
export const providers = ["provider-one", "provider-two", "provider-three"];

// ports at which providers are running
export const smsProviderPorts = [8071, 8072, 8073];
export const emailProviderPorts = [8091, 8092, 8093];
