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

export async function emailHandler(payload: EmailType, history?: Set<number>) {
  // see if this job has a request history
  // if not, create a new history set
  let priorityOrder: Set<number>;

  if (!history) {
    const emailProviderPriorities = getEmailProviderPriorities();

    console.log("Email provider priorities:");
    for (const provider of emailProviderPriorities) {
      console.log(provider.provider_name);
    }

    // rotate by +1
    const lastValue = emailProviderPriorities.pop();
    emailProviderPriorities.unshift(lastValue);

    priorityOrder = new Set(
      emailProviderPriorities.map((provider) => provider.id - 1)
    );
  }

  // select provider by passing in the relevant queues
  const providerIndex = selectProvider(emailQueues, history || priorityOrder);

  // prepare the job for the queue
  const job: JobType = {
    type: "email",
    providerIndex,
    payload: payload,
    history: history || priorityOrder,
  };

  try {
    const res = await emailQueues[providerIndex].queue.add(
      `Send email`,
      job,
      JOB_OPTIONS
    );

    console.log(
      chalk.bgGrey.black("STATUS "),
      `EMAIL-${res.id} routed to ${emailQueues[providerIndex].queue.name}`
    );
  } catch (error) {
    throw new ServerError("Error enqueueing email");
  }
}
