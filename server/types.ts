import { Window } from "@/utils";
import { Queue } from "bullmq";

export type QueueType = {
  healthy: boolean;
  window: Window;
  queue: Queue;
};
