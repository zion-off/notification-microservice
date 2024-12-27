import { QueueType } from "@/types";

export async function handler<T>(
  payload: T,
  queues: QueueType[],
  type: string
) {
  let provider = -1,
    healthy = false;
  while (!healthy) {
    provider = Math.floor(Math.random() * queues.length);
    if (queues[provider].healthy) healthy = true;
  }
  const job = {
    type: type.trim().toLowerCase(),
    provider: provider,
    payload: payload,
  };
  await queues[provider].queue.add(`Send ${type}`, job);
}
