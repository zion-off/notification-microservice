import { Job } from "bullmq";
import { handler } from "@/handler";
import {
  HEALTHY_THRESHOLD,
  smsProviderPorts,
  emailProviderPorts,
} from "@/config";
import { smsQueues, emailQueues } from ".";

const constructURL = (type: "sms" | "email", provider: number) => {
  const port =
    type === "email"
      ? emailProviderPorts[provider]
      : smsProviderPorts[provider];

  return `http://localhost:${port}/api/${type}/provider${provider + 1}`;
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
      queues[provider].window.success();
      console.log("Success");
    } else if (res.status === 500) {
      console.log("Fail");
      queues[provider].window.fail();
      handler(job.data, queues, type);
      if (queues[provider].window.getFailCount() > HEALTHY_THRESHOLD) {
        queues[provider].healthy = false;
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
