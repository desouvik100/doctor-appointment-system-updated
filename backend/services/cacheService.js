// backend/services/cacheService.js
// Redis caching service with fallback to in-memory cache

let redis = null;
let useRedis = false;

// In-memory fallback cache
const memoryCache = new Map();
const CACHE_TTL = 60; // 60 seconds default

// Initialize Redis connection
async function initializeRedis() {
  if (!process.env.REDIS_URL) {
    console.log('📦 Using in-memory cache (REDIS_URL not configured)');
    return false;
  }

  try {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      connectTimeout: 5000,
      // Stop retrying after 3 attempts — don't spam logs
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️ Redis unavailable after 3 retries — switching to in-memory cache');
          useRedis = false;
          return null; // stop retrying
        }
        return Math.min(times * 200, 1000);
      },
      // Suppress unhandled error events — we handle them below
      enableOfflineQueue: false,
    });

    // Attach error handler BEFORE connect to prevent unhandled error events
    redis.on('error', (err) => {
      // Only log once, not on every retry
      if (useRedis) {
        console.warn('⚠️ Redis error — falling back to in-memory cache:', err.message);
      }
      useRedis = false;
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      useRedis = true;
    });

    await redis.connect();
    useRedis = true;
    console.log('✅ Redis cache initialized');
    return true;
  } catch (error) {
    console.warn('⚠️ Redis connection failed, using in-memory cache:', error.message);
    useRedis = false;
    // Disconnect to stop retry loop
    if (redis) {
      try { redis.disconnect(); } catch (_) {}
      redis = null;
    }
    return false;
  }
}

// Get value from cache
async function get(key) {
  try {
    if (useRedis && redis) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    }
    
    // Fallback to memory cache
    const item = memoryCache.get(key);
    if (item && Date.now() < item.expiry) {
      return item.data;
    }
    memoryCache.delete(key);
    return null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null;
  }
}

// Set value in cache
async function set(key, value, ttl = CACHE_TTL) {
  try {
    if (useRedis && redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    }
    
    // Fallback to memory cache
    memoryCache.set(key, {
      data: value,
      expiry: Date.now() + (ttl * 1000)
    });
    return true;
  } catch (error) {
    console.error('Cache set error:', error.message);
    return false;
  }
}

// Delete value from cache
async function del(key) {
  try {
    if (useRedis && redis) {
      await redis.del(key);
      return true;
    }
    memoryCache.delete(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error.message);
    return false;
  }
}

// Clear cache by pattern
async function clearPattern(pattern) {
  try {
    if (useRedis && redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    }
    
    // Memory cache pattern clear
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        memoryCache.delete(key);
      }
    }
    return true;
  } catch (error) {
    console.error('Cache clear error:', error.message);
    return false;
  }
}

// Cache middleware for Express routes
function cacheMiddleware(ttl = CACHE_TTL) {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `route:${req.originalUrl}`;
    const cached = await get(key);

    if (cached) {
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    res.json = async (data) => {
      await set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}

// Get cache stats
function getStats() {
  return {
    type: useRedis ? 'redis' : 'memory',
    connected: useRedis ? (redis?.status === 'ready') : true,
    memorySize: memoryCache.size
  };
}

module.exports = {
  initializeRedis,
  get,
  set,
  del,
  clearPattern,
  cacheMiddleware,
  getStats
};
