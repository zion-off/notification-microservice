import { QueueType, JobType, SMSType, EmailType } from "@/utils/types";
import { JOB_OPTIONS } from "./config";

export async function handler(
  payload: SMSType | EmailType,
  queues: QueueType[],
  type: "email" | "sms"
) {
  // ascertain which providers are healthy and which are not
  const providers = queues.map((queue, index) => ({ queue, index }));
  const healthyProviders = providers.filter((q) => q.queue.stats.healthy);
  const unhealthyProviders = providers.filter((q) => !q.queue.stats.healthy);

  // requests are routed to unhealthy providers in two cases
  // if there are no healthy providers available
  // if there are unhealthy providers, then randomly
  // this gives unhealthy providers a chance to become healthy again
  const shouldSelectUnhealthy =
    healthyProviders.length === 0 ||
    (unhealthyProviders.length > 0 && Math.random() > 0.5);

  const providerIndex = shouldSelectUnhealthy
    ? Math.floor(Math.random() * unhealthyProviders.length)
    : Math.floor(Math.random() * healthyProviders.length);

  const selectedProvider = shouldSelectUnhealthy
    ? unhealthyProviders[providerIndex]
    : healthyProviders[providerIndex];

  // prepare the job for the queue
  const job: JobType = {
    type: type.trim().toLowerCase() as "email" | "sms",
    provider: selectedProvider.index,
    payload: payload,
  };

  const res = await queues[selectedProvider.index].queue.add(
    `Send ${type}`,
    job,
    JOB_OPTIONS
  );

  console.log(`Job ${res.id} sent to provider ${selectedProvider.index}`);
}
