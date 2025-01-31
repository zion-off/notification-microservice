import { Server } from "socket.io";
import http from "http";
import { smsQueues, emailQueues } from "@/lib/broker";
import { SMSType, EmailType } from "./types";
import { initialEmailPriority, initialSmsPriority } from "./config";

export let UNHEALTHY_THRESHOLD = 0.7;
export let HEALTHY_THRESHOLD = Math.round((UNHEALTHY_THRESHOLD / 3) * 10) / 10;

// priority order for email and sms
export let emailPriority = [
  {
    id: 1,
    provider_type: "email",
    provider_name: "Gmail",
    provider_key: "goog",
    priority: 1,
  },
  {
    id: 2,
    provider_type: "email",
    provider_name: "Outlook",
    provider_key: "msft",
    priority: 2,
  },
  {
    id: 3,
    provider_type: "email",
    provider_name: "Yahoo",
    provider_key: "yhoo",
    priority: 3,
  },
];

export let smsPriority = [
  {
    id: 1,
    provider_type: "sms",
    provider_name: "GrameenPhone",
    provider_key: "gp",
    priority: 1,
  },
  {
    id: 2,
    provider_type: "sms",
    provider_name: "BanglaLink",
    provider_key: "bl",
    priority: 2,
  },
  {
    id: 3,
    provider_type: "sms",
    provider_name: "Robi",
    provider_key: "robi",
    priority: 3,
  },
];

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
  socket.on("setup", emitInitialEmailList);
  socket.on("setup", emitInitialSmsList);
  socket.on("updateUnhealthyThreshold", updateHealthyThreshold);
  socket.on("emailPriority", updateEmailPriority);
  socket.on("smsPriority", updateSmsPriority);
});

export function updateEmailPriority(newPriorities) {
  const parsed = JSON.parse(newPriorities);

  emailPriority = parsed.emailProviders;

  console.log("Updated email priority: ", emailPriority);
}

export function updateSmsPriority(newPriorities) {
  const parsed = JSON.parse(newPriorities);

  smsPriority = parsed.smsProviders;

  console.log("Updated SMS priority: ", emailPriority);
}

export function emitInitialEmailList() {
  io.emit(
    "initialEmailProviderOrder",
    JSON.stringify({ initialEmailPriority })
  );
}

export function emitInitialSmsList() {
  io.emit("initialSmsProviderOrder", JSON.stringify({ initialSmsPriority }));
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
