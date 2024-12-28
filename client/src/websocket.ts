import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_SOCKETIO_URL, {
  autoConnect: false,
});
