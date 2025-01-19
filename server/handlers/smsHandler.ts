import { JobType, SMSType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { smsQueues } from "@/lib/broker";
import { selectProvider } from "@/utils/providerSelector";
import { ServerError } from "@/utils/errors";

export async function smsHandler(payload: SMSType, exclude? : number) {
  // select provider by passing in the relevant queues
  const providerIndex = selectProvider(smsQueues, exclude);
  // prepare the job for the queue
  const job: JobType = {
    type: "sms",
    providerIndex,
    payload: payload,
  };

  try {
    const res = await smsQueues[providerIndex].queue.add(
      `Send SMS`,
      job,
      JOB_OPTIONS
    );
  
    console.log(`Job ${res.id} sent to provider ${providerIndex}`);
  } catch (error) {
    throw new ServerError("Error enqueueing SMS")
  }

}
