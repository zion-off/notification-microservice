import { QueueType, JobType, SMSType, EmailType } from "@/types";

export async function handler(
  payload: SMSType | EmailType,
  queues: QueueType[],
  type: "email" | "sms"
) {
  // ascertain which providers are healthy and which are not
  const healthyProviders = queues
    .map((queue, index) => ({ queue, index }))
    .filter((q) => q.queue.stats.healthy);

  const unhealthyProviders = queues
    .map((queue, index) => ({ queue, index }))
    .filter((q) => !q.queue.stats.healthy);

  let selectedProvider: {
    queue: QueueType;
    index: number;
  };

  // requests are routed to unhealthy providers in two cases
  // if there are no healthy providers available
  // if there are unhealthy providers, then randomly
  // this gives unhealthy providers a chance to become healthy again
  if (
    healthyProviders.length === 0 ||
    (healthyProviders.length < queues.length && Math.random() > 0.5)
  ) {
    const providerIndex = Math.floor(Math.random() * unhealthyProviders.length);
    selectedProvider = unhealthyProviders[providerIndex];
  }
  // if none of those conditions are met, go with the healthy providers
  else {
    const providerIndex = Math.floor(Math.random() * healthyProviders.length);
    selectedProvider = healthyProviders[providerIndex];
  }

  // prepare the job for the queue
  const job: JobType = {
    type: type.trim().toLowerCase() as "email" | "sms",
    provider: selectedProvider.index,
    payload: payload,
  };

  await queues[selectedProvider.index].queue.add(`Send ${type}`, job, {
    attempts: 1, // retries are handled by the handler, so 1 attempt is sufficient
    removeOnComplete: true, // removes successful job from the queue
    removeOnFail: true, // removes failed job from queue
  });
}
