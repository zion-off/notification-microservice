import { Stats } from "@/utils";
import { Queue } from "bullmq";

export type QueueType = {
  stats: Stats; // stats class keeps track of provider health
  queue: Queue; // bullmq Queue instance for storing jobs
};
