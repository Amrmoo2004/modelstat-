import { createClient } from 'redis';

export const withCache = (keyFn, ttl = 3600) => async (fn) => {
  try {
    const key = keyFn();
    const cached = await redisClient.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await fn();
    
    if (result) {
      await redisClient.set(key, JSON.stringify(result), 'EX', ttl);
    }
    
    return result;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to direct function call if caching fails
    return fn();
  }
};