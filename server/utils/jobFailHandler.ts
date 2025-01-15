import { emailHandler } from "@/handlers/emailHandler";
import { smsHandler } from "@/handlers/smsHandler";
import { ServerError, ClientError } from "./errors";
import { calculateDelay } from "./helpers";
import { EmailType, SMSType, JobFailHandlerArgs } from "./types";

export async function jobFailHandler(instructions: JobFailHandlerArgs) {
  const { error, job, providerIndex, queue, type, payload } = instructions;
  if (error instanceof ServerError) {
    console.log(`Worker failed to do job ${job.id} in queue ${providerIndex}`);
    // log failure
    queue.stats.logFail();
    // send the job back for retrying and exclude this provider
    try {
      type === "email"
        ? await emailHandler(payload as EmailType, providerIndex)
        : await smsHandler(payload as SMSType, providerIndex);
      // put queue to sleep and increase delay
      await queue.queue.pause();
      setTimeout(async () => {
        await queue.queue.resume();
      }, calculateDelay(queue.stats.attempts));
    } catch (error) {
      throw Error;
    }
  } else if (error instanceof ClientError) {
    console.log(`Job ${job.id} failed, ${error.message}, ${error.details}`);
  } else {
    console.error(`Unexpected error during job ${job.id}:`, error);
  }
}
