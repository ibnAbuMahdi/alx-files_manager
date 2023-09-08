import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getConnect(req, res) {
  const b64 = req.header('Authorization');
  await dbClient.client.connect();
  const db = dbClient.client.db(process.env.DB_DATABASE || 'files_manager');
  const buff = Buffer.from(b64.split(' ')[1], 'base64');
  const data = buff.toString('ascii');
  const email = data.split(':')[0];
  const pword = data.split(':')[1];
  const hpword = crypto.createHash('sha1').update(pword).digest('hex').toString();
  const user = await db.collection('users').findOne({ email, password: hpword });

  if (user === null) {
    res.statusCode = 401;
    res.send({ error: 'Unauthorized' });
  }
  const token = uuidv4();
  const key = `auth_${token}`;

  await redisClient.set(key, user._id.toString(), 24 * 60 * 60);
  res.statusCode = 200;
  res.send({ token });
}

async function getDisconnect(req, res) {
  const token = req.header('X-Token');
  const user = await redisClient.get(`auth_${token}`);

  if (user !== null) {
    await redisClient.del(`auth_${token}`);
    res.statusCode = 204;
    res.end();
  }
  res.statusCode = 401;
  res.send({ error: 'Unauthorized' });
}

export { getConnect, getDisconnect };
