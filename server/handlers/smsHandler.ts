import chalk from "chalk";
import { JobType, SMSType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { smsQueues } from "@/lib/broker";
import { selectProvider } from "@/utils/providerSelector";
import { ServerError } from "@/utils/errors";
import { smsProviders } from "@/utils/config";

function getSmsProviderPriorities() {
  return [...smsProviders];
}

export async function smsHandler(payload: SMSType, history?: Set<string>) {
  // see if this job has a retry history
  // if not, initialize a set to record its history
  let priorityOrder: Set<string>;

  if (!history) {
    const smsProviderPriorities = getSmsProviderPriorities();

    // rotate by +1
    const lastValue = smsProviderPriorities.pop();
    smsProviderPriorities.unshift(lastValue);

    priorityOrder = new Set(
      smsProviderPriorities.map((provider) => provider.provider_name)
    );
  }

  // select provider by passing in the relevant queues
  const providerName = selectProvider(smsQueues, history || priorityOrder);
  // prepare the job for the queue
  const job: JobType = {
    type: "sms",
    providerName,
    payload: payload,
    history: Array.from(history || priorityOrder),
  };

  try {
    const selectedQueue = smsQueues.find(
      (queue) => queue.queue.name === providerName.toLowerCase()
    );
    const res = await selectedQueue.queue.add(`Send SMS`, job, JOB_OPTIONS);
    console.log(
      chalk.bgGrey.black("STATUS "),
      `SMS-${res.id} routed to ${selectedQueue.queue.name}`
    );
  } catch (error) {
    throw new ServerError("Error enqueueing SMS");
  }
}
