import { JobType, EmailType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { emailQueues } from "@/lib/broker";
import { selectProvider } from "@/utils/providerSelector";
import { ServerError } from "@/utils/errors";
import { emailPriority } from "@/utils/websocket";

async function getEmailProviderPriorities() {
  return [...emailPriority];
}

export async function emailHandler(payload: EmailType, history?: Set<number>) {
  // see if this job has a request history
  // if not, create a new history set
  let priorityOrder: Set<number>;

  if (!history) {
    const emailProviderPriorities = await getEmailProviderPriorities();

    // rotate by +1
    const lastValue = emailProviderPriorities.pop();
    emailProviderPriorities.unshift(lastValue);

    priorityOrder = new Set(
      emailProviderPriorities.map((provider) => provider.id - 1)
    );

    console.log(priorityOrder);
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

    console.log(`Job ${res.id} sent to provider ${providerIndex}`);
  } catch (error) {
    throw new ServerError("Error enqueueing email");
  }
}
