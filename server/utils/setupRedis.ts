import { createClient } from "redis";

export async function setupRedis() {
  try {
    const client = createClient({
      url: `redis://localhost:${process.env.REDIS_PORT}`
    });
    client.on("error", (err) => console.error("Redis Client Error:", err));
    await client.connect();
    console.log("Redis client connected");
    return client;
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
}
