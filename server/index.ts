import express, { Request, Response, NextFunction } from "express";
import router from "@/routes/index";
import cors from "cors";
import { server } from "@/utils/websocket";
import { SERVER_PORT } from "@/utils/config";

const app = express();
app.use(cors());
app.use(express.json());

// middleware to handle errors thrown by request parser
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

// mount router
app.use("/api", router);

app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});

server.listen(process.env.SOCKETIO_PORT, () => {
  console.log(`SocketIO server istening on port ${process.env.SOCKETIO_PORT}`);
});
