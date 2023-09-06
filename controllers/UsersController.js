import redisClient from '../utils/redis'
import dbClient from '../utils/db'
import CryptoJs from 'crypto-js'
import { ObjectId } from 'mongodb'

async function getMe(req, res){
  const token = req.header('X-Token')
  const userId = await redisClient.get("auth_"+token)
  if (userId === null) {
    res.statusCode = 401
    res.send({"error": "Unauthorized"})
  }
  await dbClient.client.connect()
  const db = dbClient.client.db(process.env['DB_DATABASE'] || 'files_manager')
  const user = await db.collection('users').findOne({"_id": ObjectId(userId.toString())})
  res.send({"id": userId, "email": user.email})
}

async function postNew(req, res) {
  try {
    await dbClient.client.connect();
    const db = dbClient.client.db(process.env['DB_DATABASE'] || 'files_manager');
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
    const passHash = CryptoJs.SHA1(password).toString();

    const newUser = {
      "email": email,
      "password": passHash
    };
    const result = await db.collection('users').insertOne(newUser);
    return res.status(201).json({ email, id: result.insertedId });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export { postNew, getMe };
