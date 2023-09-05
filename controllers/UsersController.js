import redisClient from '../utils/redis'
import dbClient from '../utils/db'
import CryptoJs from 'crypto-js';
import dbClient from '../utils/db';

Async function getMe(req, res){
  const token = req.headers['X-Token']
  const user_id = await redisClient.get("auth_"+token)
  if (user_id === null) {
    res.statusCode = 401
    throw new Error("Unauthorized")
  }
  const user = await dbClient.client.collection('users').findOne({"id": user_id}, {projection: {email: 1, id: 1}})
  res.send(user)
}

async function postNew(req, res) {
  try {
    await dbClient.client.connect();
    const db = dbClient.client.db();
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing Email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const checkExists = await db.collection('users').findOne({ email });
    if (checkExists) {
      return res.status(400).json({ error: 'Already Exists' });
    }
    const passHash = CryptoJs.SHA1(password);

    const newUser = {
      email,
      password: passHash,
    };
    const result = await db.collection('users').insertOne(newUser);
    return res.status(201).json({ email, id: result.insertedId });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default postNew;
