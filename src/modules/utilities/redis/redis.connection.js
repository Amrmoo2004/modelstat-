import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const useTLS = process.env.REDIS_URL.startsWith('rediss://');

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: useTLS,  
    rejectUnauthorized: false,
    connectTimeout: 10000,
    reconnectStrategy: (retries) => Math.min(retries * 200, 5000)
  }
});

redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error('❌ Redis server refused connection');
  } else if (err.code === 'ETIMEDOUT') {
    console.error('⌛ Connection timed out');
  } else {
    console.error('Redis error:', err.message);
  }
});

redisClient.on('connect', () => console.log('🔄 Connecting to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis connected successfully'));
redisClient.on('reconnecting', () => console.log('🔁 Reconnecting to Redis...'));

(async () => {
  try {
    await redisClient.connect();
    
    await redisClient.set('connection_test', 'success', { EX: 10 });
    const value = await redisClient.get('connection_test');
    console.log('Connection verified with value:', value);
  } catch (err) {
    console.error('❌ Initial connection failed:', err.message);
    process.exit(1);
  }
})();

export default redisClient;