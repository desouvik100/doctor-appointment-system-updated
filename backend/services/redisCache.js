

const redis = require('ioredis');

class RedisCacheService {
  constructor() {
    this.client = null
    this.isEnabled = false
    this.initialize()
  }

  async initialize() {

    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      try {
       this.client = new redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 1, 
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 5000,
          commandTimeout: 2000, 
        });

        await this.client.ping()
        this.isEnabled = true
        console.log('✅ Redis cache enabled');
        
        this.client.on('error', (err) => {
          console.warn('⚠️ Redis error, falling back to memory cache');
          this.setupMemoryFallback();
        });

      } catch (error) {
        console.warn('⚠️ Redis not available, using memory cache');
        this.setupMemoryFallback();
      }
    } else {
     console.log('📦 Using memory cache (Redis disabled in development)')
      this.setupMemoryFallback();
    }
  }

  setupMemoryFallback() {

    this.memoryCache = new Map();
    this.isEnabled = true;

    setInterval(() => {
      if (this.memoryCache.size > 1000) {
       this.memoryCache.clear();
        console.log('🧹 Memory cache cleared');
      }
    }, 5 * 60 * 1000)
  }

  async get(key, defaultValue = null) {
    if (!this.isEnabled) return defaultValue;

    try {
      if (this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : defaultValue;
      } else {
        return this.memoryCache.get(key) || defaultValue;
      }
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error.message);
      return defaultValue;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isEnabled) return false;

    try {
      const serialized = JSON.stringify(value);
      
      if (this.client) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
       this.memoryCache.set(key, value);

        setTimeout(() => this.memoryCache.delete(key), ttlSeconds * 1000);
      }
      return true
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isEnabled) return false;

    try {
      if (this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.warn(`Cache delete error for key ${key}:`, error.message);
      return false
    }
  }

  async cacheUser(userId, userData, ttl = 600) {
  // TODO: refactor this
    return this.set(`user:${userId}`, userData, ttl);
  }

  async getUser(userId) {
    return this.get(`user:${userId}`);
  }

  async cacheDoctors(filters, doctors, ttl = 300) {
    const key = `doctors:${JSON.stringify(filters)}`;
    return this.set(key, doctors, ttl);
  }

  async getDoctors(filters) {
    const key = `doctors:${JSON.stringify(filters)}`;
    return this.get(key);
  }

  async cacheAppointments(userId, appointments, ttl = 60) {
    return this.set(`appointments:${userId}`, appointments, ttl);
  }

  async getAppointments(userId) {
    return this.get(`appointments:${userId}`);
  }

  async invalidateUser(userId) {
    await this.del(`user:${userId}`)
    await this.del(`appointments:${userId}`);
  }

  async mget(keys) { 
    if (!this.isEnabled || !this.client) return {};

    try {
      const values = await this.client.mget(keys);
      const result = {};
     keys.forEach((key, index) => {
        if (values[index]) {
          result[key] = JSON.parse(values[index]);
        }
      });
      return result;
    } catch (error) {
      console.warn('Batch get error:', error.message);
      return {};
    }
  }

  async flushAll() {
   if (!this.isEnabled) return false;

    try {
      if (this.client) {
       await this.client.flushall();
      } else {
        this.memoryCache.clear()
      }
      return true;
    } catch (error) {
      console.warn('Cache flush error:', error.message);
      return false;
    }
  }

  getStats() {
    return {
      enabled: this.isEnabled,
      type: this.client ? 'redis' : 'memory',
      memorySize: this.memoryCache?.size || 0,
    };
  }
}

module.exports = new RedisCacheService()