import chalk from "chalk";
import { JobType, EmailType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { emailQueues } from "@/lib/broker";
import { selectProvider } from "@/utils/providerSelector";
import { ServerError } from "@/utils/errors";
import { emailProviders } from "@/utils/config";

function getEmailProviderPriorities() {
  return [...emailProviders];
}

export async function emailHandler(payload: EmailType, history?: Set<string>) {
  // see if this job has a request history
  // if not, initialize a set to record its history
  let priorityOrder: Set<string>;

  if (!history) {
    const emailProviderPriorities = getEmailProviderPriorities();

    // rotate by +1
    const lastValue = emailProviderPriorities.pop();
    emailProviderPriorities.unshift(lastValue);

    priorityOrder = new Set(
      emailProviderPriorities.map((provider) => provider.provider_name)
    );
  }

  // select provider by passing in the relevant queues
  const providerName = selectProvider(emailQueues, history || priorityOrder);
  // prepare the job for the queue
  const job: JobType = {
    type: "email",
    providerName,
    payload: payload,
    history: Array.from(history || priorityOrder),
  };

  try {
    const selectedQueue = emailQueues.find(
      (queue) => queue.queue.name === providerName.toLowerCase()
    );
    const res = await selectedQueue.queue.add(`Send email`, job, JOB_OPTIONS);
    console.log(
      chalk.bgGrey.black("STATUS "),
      `EMAIL-${res.id} routed to ${selectedQueue.queue.name}`
    );
  } catch (error) {
    throw new ServerError("Error enqueueing email");
  }
}
