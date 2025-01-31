import chalk from "chalk";
import { emailHandler } from "@/handlers/emailHandler";
import { smsHandler } from "@/handlers/smsHandler";
import { ServerError, ClientError } from "../utils/errors";
import { calculateDelay } from "../utils/helpers";
import { EmailType, SMSType, JobFailHandlerArgs } from "../utils/types";

export async function jobFailHandler(instructions: JobFailHandlerArgs) {
  const { error, job, history, queue, type, payload } = instructions;
  if (error instanceof ServerError) {
    console.log(
      chalk.bgRed.black("ERROR  "),
      `Worker failed to send ${type.toUpperCase()}-${job.id} from ${
        queue.queue.name
      }`
    );
    // log failure
    queue.stats.logFail();
    // send the job back for retrying and exclude this provider
    try {
      if (type === "email") {
        await emailHandler(payload as EmailType, history);
      } else if (type === "sms") {
        await smsHandler(payload as SMSType, history);
      }
      // put queue to sleep and increase delay
      await queue.queue.pause();
      setTimeout(async () => {
        await queue.queue.resume();
      }, calculateDelay(queue.stats.attempts));
    } catch (error) {
      throw Error;
    }
  } else if (error instanceof ClientError) {
    console.log(
      chalk.bgRed.black("ERROR  "),
      `${type.toUpperCase()}-${job.id} failed to send, ${error.message}, ${
        error.details
      }`
    );
  } else {
    console.log(
      chalk.bgRed.black("ERROR  "),
      `Unexpected error occuring when sending ${type.toUpperCase()}-${
        job.id
      }: ${error}`
    );
  }
}
