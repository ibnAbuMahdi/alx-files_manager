import redisClient from '../utils/redis'
import dbClient from '../utils/db'

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
