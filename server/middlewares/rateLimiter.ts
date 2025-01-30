import { Request, Response, NextFunction } from "express";

import { redis } from "..";

// Middleware to validate Email request body
export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // We need the IP address so we can rate limit clients individually
  const request_address = req.socket.remoteAddress.toString();

  if (process.env.RATE_LIMIT_ALGORITHM === "TOKEN_BUCKET") {
    try {
      // check if this user is new, if yes, create a bucket
      const addressExists = await redis.exists(request_address);

      if (!addressExists) {
        await redis.hSet(request_address, {
          tokens: process.env.BUCKET_SIZE,
          timestamp: new Date().toISOString(),
        });
      }

      // check when their bucket was last updated
      // each minute, the bucket gets # of new tokens = REFILL_RATE
      const client_bucket = await redis.hGetAll(request_address);
      const last_updated_date = new Date(client_bucket.timestamp);
      const difference = new Date().getTime() - last_updated_date.getTime();
      const minutes_elapsed = Math.floor(difference / 60000);

      // determine how many tokens the client should haven now
      const refill_rate = parseInt(process.env.REFILL_RATE, 10);
      const bucket_size = parseInt(process.env.BUCKET_SIZE, 10);
      const bucket_tokens = parseInt(client_bucket.tokens, 10);
      const newTokens = bucket_tokens + minutes_elapsed * refill_rate;
      const available_tokens = Math.min(newTokens, bucket_size);
      const updated_tokens = available_tokens - 1;

      // update redis
      await redis.hSet(request_address, {
        tokens: updated_tokens,
        timestamp: new Date().toISOString(),
      });

      if (available_tokens <= 0) {
        res
          .status(429)
          .set({ "X-Ratelimit-Remaining": Math.max(available_tokens, 0) })
          .end();

        console.log("Rate limited client:", request_address);

        return;
      }
    } catch (error) {
      console.error(`Error rate limiting: ${error}`);
    }
  }

  next();
};
