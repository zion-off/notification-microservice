import { Server } from "socket.io";
import http from "http";
import { smsQueues, emailQueues } from "@/utils/broker";

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
});

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

export function providerFail() {
  io.emit("Fail", {
    someProperty: "some value",
    otherProperty: "other value",
  }); // This will emit the event to all connected sockets
}

export function providerSuccess() {
  io.emit("Success", {
    someProperty: "some value",
    otherProperty: "other value",
  }); // This will emit the event to all connected sockets
}
