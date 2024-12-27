import { Job } from "bullmq";
import { handler } from "@/handler";
import { smsProviderPorts, emailProviderPorts, DELAY_BASE } from "@/config";
import { smsQueues, emailQueues } from ".";

const constructURL = (type: "sms" | "email", provider: number) => {
  const port =
    type === "email"
      ? emailProviderPorts[provider]
      : smsProviderPorts[provider];

  return `http://localhost:${port}/api/${type}/provider${provider + 1}`;
};

const calculateDelay = (attempt: number) => {
  return Math.pow(2, attempt) * DELAY_BASE;
};

export const workerCallback = async (job: Job) => {
  const { type, provider, payload } = job.data;
  const queues = type === "email" ? emailQueues : smsQueues;
  try {
    const url = constructURL(type, provider);
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      // log success
      queues[provider].stats.logSuccess();
      console.log("Success");
    } else if (res.status === 500) {
      // log failure
      queues[provider].stats.logFail();
      console.log("Fail");
      // send the job back for retrying
      handler(job.data, queues, type);
      // put queue to sleep and increase delay
      await queues[provider].queue.pause();
      setTimeout(async () => {
        await queues[provider].queue.resume();
      }, calculateDelay(queues[provider].stats.attempts));
    }
  } catch (error) {
    console.log(error.message);
  }
};
