// src/lib/redis.ts
import { createClient } from "redis";

/**
 * Redis Client for Performance Caching
 * 
 * Used for caching static/semi-static data:
 * - University list (changes rarely)
 * - Problem categories (nearly static)
 * - Evaluation criteria (nearly static)
 * - Consultant lists (TTL: 5 minutes)
 * 
 * NOT used for:
 * - Bookings (personalized, changes frequently)
 * - Time slots (availability changes frequently)
 * - User-specific data
 */

let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Redis client singleton
 */
export async function getRedisClient() {
  if (!redisClient) {
    // Only create if REDIS_URL is configured
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn("[Redis] REDIS_URL not configured - caching disabled");
      return null;
    }

    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            console.error("[Redis] Max reconnection attempts reached");
            return new Error("Redis max retries reached");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err: any) => {
      console.error("[Redis] Client error:", err);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });

    try {
      await redisClient.connect();
    } catch (error) {
      console.error("[Redis] Failed to connect:", error);
      redisClient = null;
      return null;
    }
  }

  return redisClient;
}

/**
 * Cache wrapper with automatic fallback
 * If Redis fails, it will return null and let the caller proceed without cache
 */
export async function getCached<T>(
  key: string
): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(key);
    if (!cached) return null;
    
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`[Redis] Failed to get key ${key}:`, error);
    return null;
  }
}

/**
 * Set cache with TTL
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to set key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cache key(s)
 */
export async function deleteCache(
  keys: string | string[]
): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    await client.del(keyArray);
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to delete keys:`, error);
    return false;
  }
}

/**
 * Pattern-based cache invalidation
 * Use carefully - can be expensive
 */
export async function deleteCachePattern(
  pattern: string
): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`[Redis] Failed to delete pattern ${pattern}:`, error);
    return false;
  }
}

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  // Static data (long TTL)
  universities: () => "api:universities:map:v1",
  problemCategories: () => "api:problem-categories:v1",
  evaluationCriteria: () => "api:evaluation-criteria:v1",
  
  // Semi-static data (short TTL)
  consultants: (universityId: number) => `api:consultants:uni:${universityId}:v1`,
  
  // Invalidation patterns
  consultantsPattern: (universityId: number) => `api:consultants:uni:${universityId}:*`,
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  UNIVERSITIES: 3600,        // 1 hour (changes very rarely)
  PROBLEM_CATEGORIES: 86400, // 24 hours (nearly static)
  EVALUATION_CRITERIA: 86400, // 24 hours (nearly static)
  CONSULTANTS: 300,          // 5 minutes (semi-static)
} as const;
