/**
 * Redis Cache Service for Mausam Microservice
 * Provides sub-millisecond retrieval of live IMD & Doppler radar feeds
 * Includes graceful in-memory Map fallback if standalone Redis is not connected.
 */

const Redis = require("ioredis");

class RedisService {
  constructor() {
    this.memoryStore = new Map();
    this.memoryExpiry = new Map();
    this.isConnected = false;

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        console.log(" Connected to Redis cluster at", redisUrl);
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        // Silent fallback to in-memory store
      });
    } catch (e) {
      this.isConnected = false;
    }
  }

  async get(key) {
    if (this.isConnected) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        // Fallback to memory
      }
    }

    // Check memory store
    const expiry = this.memoryExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.memoryStore.delete(key);
      this.memoryExpiry.delete(key);
      return null;
    }
    return this.memoryStore.get(key) || null;
  }

  async set(key, value, ttlSeconds = 600) {
    const serialized = JSON.stringify(value);

    if (this.isConnected) {
      try {
        await this.client.set(key, serialized, "EX", ttlSeconds);
        return;
      } catch (e) {
        // Fallback to memory
      }
    }

    // Store in memory
    this.memoryStore.set(key, value);
    if (ttlSeconds > 0) {
      this.memoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
  }
}

module.exports = new RedisService();
