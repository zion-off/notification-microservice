import { QueueType } from "@/utils/types";

export function selectProvider(queues: QueueType[], exclude?: number): number {
  // ascertain which providers are healthy and which are not
  const providers = queues
    .map((item, index) => ({ queue: item, index: index }))
    .filter((item) => item.index != exclude);
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

  const providerIndex = shouldSelectUnhealthy
    ? Math.floor(Math.random() * unhealthyProviders.length)
    : Math.floor(Math.random() * healthyProviders.length);

  const selectedProvider = shouldSelectUnhealthy
    ? unhealthyProviders[providerIndex]
    : healthyProviders[providerIndex];

  return selectedProvider.index;
}
