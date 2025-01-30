import { JobType, SMSType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { smsQueues } from "@/lib/broker";
import { selectProvider } from "@/utils/providerSelector";
import { ServerError } from "@/utils/errors";

async function getSmsProviderPriorities() {
  return [
    {
      id: 1,
      provider_type: "sms",
      provider_name: "GrameenPhone",
      provider_key: "gp",
      priority: 2,
    },
    {
      id: 2,
      provider_type: "sms",
      provider_name: "BanglaLink",
      provider_key: "bl",
      priority: 1,
    },
    {
      id: 3,
      provider_type: "sms",
      provider_name: "Robi",
      provider_key: "robi",
      priority: 3,
    },
  ];
}

export async function smsHandler(payload: SMSType, history?: Set<number>) {
  // see if this job has a retry history
  // if not, create a new history set
  let priorityOrder: Set<number>;

  if (!history) {
    const smsProviderPriorities = await getSmsProviderPriorities();
    // rotate by +1
    const lastValue = smsProviderPriorities.pop();
    smsProviderPriorities.unshift(lastValue);

    priorityOrder = new Set(
      smsProviderPriorities.map((provider) => provider.priority)
    );
  }

  // select provider by passing in the relevant queues
  const providerIndex = selectProvider(smsQueues, history || priorityOrder);
  // prepare the job for the queue
  const job: JobType = {
    type: "sms",
    providerIndex,
    payload: payload,
    history: history || priorityOrder,
  };

  try {
    const res = await smsQueues[providerIndex].queue.add(
      `Send SMS`,
      job,
      JOB_OPTIONS
    );

    console.log(`Job ${res.id} sent to provider ${providerIndex}`);
  } catch (error) {
    throw new ServerError("Error enqueueing SMS");
  }
}
