import { FAILURE_THRESHOLD } from "@/config";

export class Stats {
  size: number; // number of most recent request outcomes to keep track of
  next: number; // next available position in the array (wraps around)
  stats: number[]; // binary array representing successes and failures
  successCount: number; // how many requests in the window succeeded
  failureCount: number; // how many requests in the window failed
  attempts: number; // for calculating backoff
  healthy: boolean; // flag for marking provider as (un)available

  constructor(size: number) {
    this.size = size;
    this.next = 0;
    this.stats = new Array(size).fill(0);
    this.successCount = 0;
    this.failureCount = 0;
    this.attempts = 0;
    this.healthy = true;
  }

  logFail() {
    const index = this.stats[this.next % this.size];
    if (index === 1) {
      this.successCount--;
    }
    this.stats[this.next % this.size] = 0;
    this.failureCount++;
    this.next++;
    // check if this provider has failed enough times
    // if it has, mark it as unhealthy
    if (this.healthy) {
      this.attempts++;
      if (this.failureCount / this.successCount >= FAILURE_THRESHOLD) {
        this.healthy = false;
      }
    }
  }

  logSuccess() {
    const index = this.stats[this.next % this.size];
    if (index === 0) {
      this.failureCount--;
    }
    this.stats[this.next % this.size] = 1;
    this.successCount++;
    this.next++;
    // check if this was an unhealthy provider
    // if it was, see if it can be marked healthy again
    if (!this.healthy) {
      this.attempts = 0;
      if (this.failureCount / this.successCount < FAILURE_THRESHOLD) {
        this.healthy = true;
      }
    }
  }
}
