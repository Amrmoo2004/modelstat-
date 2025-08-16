import redisClient from "../utilities/redis/redis.connection.js";
// authMiddleware.js
const checkTokenRevoked = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  // Check Redis blacklist
  const isRevoked = await redisClient.get(`blacklist:${token}`);
  if (isRevoked) {
    return res.status(401).json({ error: "Token revoked" });
  }

  next();
};

export default checkTokenRevoked;