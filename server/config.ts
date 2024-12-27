import dotenv from "dotenv";
dotenv.config();

export const { SERVER_PORT, REDIS_HOST, REDIS_PORT } = process.env;

// options for bullmq
export const options = {
  connection: { host: REDIS_HOST, port: Number(REDIS_PORT) },
};

// for tracking success/error ratio of last N requests
export const WINDOW_SIZE = 5;

// if failures > N in a window, provider is flagged as unhealthy
export const HEALTHY_THRESHOLD = 1;

// names for mapping providers to queues
export const providers = ["provider-one", "provider-two", "provider-three"];

// ports at which providers are running
export const smsProviderPorts = [8071, 8072, 8073];
export const emailProviderPorts = [8091, 8092, 8093];
