import { JobType, SMSType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { smsQueues } from "@/utils/broker";
import { selectProvider } from "@/utils/providerSelector";

export async function smsHandler(payload: SMSType, exclude? : number) {
  // select provider by passing in the relevant queues
  const provider = selectProvider(smsQueues, exclude);
  // prepare the job for the queue
  const job: JobType = {
    type: "sms",
    provider: provider,
    payload: payload,
  };
  const res = await smsQueues[provider].queue.add(
    `Send SMS`,
    job,
    JOB_OPTIONS
  );

  console.log(`Job ${res.id} sent to provider ${provider}`);
}
