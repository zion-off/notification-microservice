class Window {
  size: number;
  next: number;
  successCount: number;
  failureCount: number;
  window: number[];

  constructor(size: number) {
    this.size = size;
    this.next = 0;
    this.successCount = 0;
    this.failureCount = 0;
    this.window = new Array(size).fill(0);
  }

  fail() {
    const index = this.window[this.next % this.size];

    if (index === 1) {
      this.successCount--;
    }
    
    this.window[this.next % this.size] = 0;
    this.failureCount++;
    this.next++;
  }

  success() {
    const index = this.window[this.next % this.size];

    if (index === 0) {
      this.failureCount--;
    }

    this.window[this.next % this.size] = 1;
    this.successCount++;
    this.next++;
  }

  getFailCount(): number {
    return this.failureCount;
  }

  getSuccessCount(): number {
    return this.successCount;
  }
}
