import { QueueType } from "@/utils/types";

export function selectProvider(
  queues: QueueType[],
  history: Set<number>
): number {
  // round robin provider selection
  const lastProvider = history.values().next().value;
  history.delete(lastProvider);
  history.add(lastProvider);

  // sort providers based on priority
  let providers = [];
  for (const index of history.values()) {
    providers.push({
      queue: queues[index],
      index: index,
    });
  }

  const healthyProviders = providers.filter((item) => item.queue.stats.healthy);
  const unhealthyProviders = providers.filter(
    (item) => !item.queue.stats.healthy
  );

  // requests are routed to unhealthy providers in two cases
  // if there are no healthy providers available
  // if there are unhealthy providers, then randomly
  // this gives unhealthy providers a chance to become healthy again
  const shouldSelectUnhealthy =
    healthyProviders.length === 0 ||
    (unhealthyProviders.length > 0 && Math.random() > 0.5);

  if (shouldSelectUnhealthy) {
    const providerIndex = Math.floor(Math.random() * unhealthyProviders.length);
    return unhealthyProviders[providerIndex].index;
  }

  return healthyProviders[0].index;
}
