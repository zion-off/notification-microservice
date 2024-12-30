import { JobType, EmailType } from "@/utils/types";
import { JOB_OPTIONS } from "@/utils/config";
import { emailQueues } from "@/utils/broker";
import { selectProvider } from "@/utils/providerSelector";

export async function emailHandler(payload: EmailType, exclude? : number) {
  // select provider by passing in the relevant queues
  const provider = selectProvider(emailQueues, exclude);
  // prepare the job for the queue
  const job: JobType = {
    type: "email",
    provider: provider,
    payload: payload,
  };
  const res = await emailQueues[provider].queue.add(
    `Send email`,
    job,
    JOB_OPTIONS
  );

  console.log(`Job ${res.id} sent to provider ${provider}`);
}
