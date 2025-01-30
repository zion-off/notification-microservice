import express, { Request, Response, NextFunction } from "express";
import { createClient } from "redis";
import router from "@/routes/index";
import cors from "cors";
import { server } from "@/utils/websocket";
import { setupRedis } from "@/utils/setupRedis";
import { rateLimiter } from "@/middlewares/rateLimiter";

const app = express();
app.use(cors());
app.use(express.json());

// middleware to handle errors thrown by request parser
// app.use(rateLimiter);

// middleware to handle errors thrown by request parser
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

// mount router
app.use("/api", router);

export let redis: ReturnType<typeof createClient>;

async function main() {
  try {
    redis = await setupRedis();
    const PORT = process.env.SERVER_PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.listen(process.env.SOCKETIO_PORT, () => {
      console.log(
        `SocketIO server istening on port ${process.env.SOCKETIO_PORT}`
      );
    });
  } catch (err) {
    console.error("Error starting the application:", err);
    process.exit(1);
  }
}

main();

process.on("uncaughtException", function (err) {
  console.log(err);
});
