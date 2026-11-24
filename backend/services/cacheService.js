

let redis = null;
let useRedis = false;
const memoryCache = new Map();
const CACHE_TTL = 60; 
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
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️ Redis unavailable after 3 retries — switching to in-memory cache');
          useRedis = false;
          return null; 
        }
        return Math.min(times * 200, 1000);
      },
      enableOfflineQueue: false,
    });
    redis.on('error', (err) => {
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
    if (redis) {
      try { redis.disconnect(); } catch (_) {}
      redis = null;
    }
    return false;
  }
}
async function get(key) {
  try {
    if (useRedis && redis) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    }
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
async function set(key, value, ttl = CACHE_TTL) {
  try {
    if (useRedis && redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    }
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
async function clearPattern(pattern) {
  try {
    if (useRedis && redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    }
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
    const originalJson = res.json.bind(res);
    
    res.json = async (data) => {
      await set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}
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
