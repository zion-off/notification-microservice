import { Server } from "socket.io";
import http from "http";
import { smsQueues, emailQueues } from "@/lib/broker";
import { SMSType, EmailType } from "./types";
import { emailProviders, smsProviders } from "./config";
import priorityUpdater from "./priorityUpdater";

export let UNHEALTHY_THRESHOLD = 0.7;
export let HEALTHY_THRESHOLD = Math.round((UNHEALTHY_THRESHOLD / 3) * 10) / 10;

export const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

io.on("connection", (socket) => {
  console.log("WebSocket client connected");
  socket.on("disconnect", () => {
    console.log("WebSocket client disconnected");
  });

  socket.on("setup", emitEmailStats);
  socket.on("setup", emitSmsStats);
  socket.on("setup", emitEmailList);
  socket.on("setup", emitSmsList);
  socket.on("updateUnhealthyThreshold", updateHealthyThreshold);
  socket.on("emailPriority", updateEmailPriority);
  socket.on("smsPriority", updateSmsPriority);
});

export function updateEmailPriority(newPriorities: string) {
  const parsed = JSON.parse(newPriorities);
  priorityUpdater(emailProviders, parsed.emailProviders);
}

export function updateSmsPriority(newPriorities: string) {
  const parsed = JSON.parse(newPriorities);
  priorityUpdater(smsProviders, parsed.smsProviders);
}

export function emitEmailList() {
  io.emit("initialEmailProviderOrder", JSON.stringify(emailProviders));
}

export function emitSmsList() {
  io.emit("initialSmsProviderOrder", JSON.stringify(smsProviders));
}

export function updateHealthyThreshold(size: number) {
  UNHEALTHY_THRESHOLD = size;
  HEALTHY_THRESHOLD = Math.round((UNHEALTHY_THRESHOLD / 3) * 10) / 10;
}

export function emitEmailStats() {
  const emailStats = emailQueues.map((queue) => ({
    healthy: queue.stats.healthy,
    window: queue.stats.stats,
  }));

  io.emit(
    "emailStats",
    JSON.stringify({
      emailStats,
    })
  );
}

export function emitSmsStats() {
  const smsStats = smsQueues.map((queue) => ({
    healthy: queue.stats.healthy,
    window: queue.stats.stats,
  }));

  io.emit(
    "smsStats",
    JSON.stringify({
      smsStats,
    })
  );
}

export function emitQueueSize(type: "sms" | "email", count: number[]) {
  io.emit(
    "queueSize",
    JSON.stringify({
      type: type,
      count: count,
    })
  );
}

export function emitSmsResult(payload: SMSType, success: boolean) {
  io.emit(
    "smsResult",
    JSON.stringify({
      success: success,
      payload: payload,
    })
  );
}

export function emitEmailResult(payload: EmailType, success: boolean) {
  io.emit(
    "emailResult",
    JSON.stringify({
      success: success,
      payload: payload,
    })
  );
}
