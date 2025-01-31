import chalk from "chalk";

import { QueueType } from "@/utils/types";

export function selectProvider(
  queues: QueueType[],
  history: Set<string>
): string {
  // round robin provider selection
  const firstItem = history.values().next().value;
  history.delete(firstItem);
  history.add(firstItem);

  // sort providers based on priority
  let providers = [];
  for (const provider of history.values()) {
    const queue = queues.find(
      (queue) => queue.queue.name.split("-")[0] === provider.toLowerCase()
    );
    providers.push(queue);
  }

  const healthyProviders = providers.filter((item) => item.stats.healthy);
  const unhealthyProviders = providers.filter((item) => !item.stats.healthy);

  // requests are routed to unhealthy providers in two cases
  // if there are no healthy providers available
  // if there are unhealthy providers, then randomly
  // this gives unhealthy providers a chance to become healthy again
  const shouldSelectUnhealthy =
    healthyProviders.length === 0 ||
    (unhealthyProviders.length > 0 && Math.random() > 0.5);

  if (shouldSelectUnhealthy) {
    const providerIndex = Math.floor(Math.random() * unhealthyProviders.length);
    console.log(chalk.bgBlue.black("INFO   "), "Selected unhealthy provider");
    return unhealthyProviders[providerIndex].queue.name;
  }

  return healthyProviders[0].queue.name;
}
