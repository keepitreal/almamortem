import { Redis } from "@upstash/redis";
import { env } from "~/env";

// Create Redis client
export const redis = new Redis({
  url:
    env.UPSTASH_REDIS_REST_URL ?? "https://no-redis-in-development.upstash.io",
  token: env.UPSTASH_REDIS_REST_TOKEN ?? "no-token-in-development",
});
