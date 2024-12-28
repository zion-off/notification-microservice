import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { server } from "@/websocket";
import { handler } from "@/handler";
import { SERVER_PORT } from "@/config";
import { emailQueues, smsQueues } from "@/broker";

const app = express();
app.use(cors());
app.use(express.json());

// middleware to handle errors thrown by request parser
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

// register sms route
app.post("/api/sms", async (req: Request, res: Response) => {
  const { phone, text } = req.body;
  if (!phone || !text) {
    res.status(400).json({ error: "Invalid request" });
  } else {
    await handler({ phone: phone, text: text }, smsQueues, "sms");
    res.status(200).json();
  }
});

// register email route
app.post("/api/email", async (req: Request, res: Response) => {
  const { subject, body, recipients } = req.body;
  if (!subject || !body || !recipients) {
    res.status(400).json({ error: "Invalid request" });
  } else {
    await handler({ subject, body, recipients }, emailQueues, "email");
    res.status(200).json();
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});

server.listen(process.env.SOCKETIO_PORT, () => {
  console.log(`SocketIO server istening on port ${process.env.SOCKETIO_PORT}`);
});
