import redisClient from '../utils/redis'
import dbClient from '../utils/db'
import CryptoJs from 'crypto-js';

async function getMe(req, res){
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
  let deb = ""
  try {
    await dbClient.client.connect();
    const db = dbClient.client.db('files_manager');
    deb = "db connection";
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
    deb = "findOne"+email+passHash;
    const result = await db.collection('users').insertOne(newUser);
    deb = "insertOne";
    return res.status(201).json({ email, id: result.insertedId });
  } catch (err) {
    console.log(deb);
    console.log(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export { postNew, getMe };
