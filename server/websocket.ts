import { Server } from "socket.io";
import http from "http";
import { smsQueues, emailQueues } from "./broker";

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
  const smsStats = smsQueues.map((queue) => queue.stats.stats);
  const emailStats = emailQueues.map((queue) => queue.stats.stats);
  socket.emit(
    "stats",
    JSON.stringify({
      sms: smsStats,
      email: emailStats,
    })
  );
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected');
  });
});

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
