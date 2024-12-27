import { QueueType } from "@/types";

export async function handler<T>(
  payload: T,
  queues: QueueType[],
  type: string
) {
  let provider = -1,
    healthyProviderFound = false;
  while (!healthyProviderFound) {
    provider = Math.floor(Math.random() * queues.length);
    if (queues[provider].stats.healthy) healthyProviderFound = true;
  }
  const job = {
    type: type.trim().toLowerCase(),
    provider: provider,
    payload: payload,
  };
  await queues[provider].queue.add(`Send ${type}`, job, {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: true,
  });
}
