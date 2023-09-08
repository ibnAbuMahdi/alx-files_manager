import redisClient from '../utils/redis';
import dbClient from '../utils/db';

function getStatus(req, res) {
  if (redisClient.isAlive()) {
    res.statusCode = 200;
    res.send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }
}

async function getStats(req, res) {
  res.statusCode = 200;
  const usrs = await dbClient.nbUsers();
  const fls = await dbClient.nbFiles();
  res.send({ users: usrs, files: fls });
}

export { getStatus, getStats };
