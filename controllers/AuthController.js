import dbClient from '../utils/db'
import crypto from 'crypto'
import { uuid } from 'uuidv4'
import redisClient from '../utils/redis'

async function getConnect(req, res){
  const b64 = req.headers['Authorization']

  let buff = new Buffer(b64.split(' ')[1], 'base64')
  let data = buff.toString('ascii')
  const email = data.split(':')[0]
  const pword = data.split(':')[1]
  const hpword = crypto.createHash('sha1').update(pword).digest('hex')
  const user = await dbClient.findOne({email: email, password: hpword})
  
  if (user === null){
    res.statusCode = 401
    throw new Error('Unauthorized')
  }
  
  const token = uuid()
  const key = "auth_"+token

  await redisClient.set(key, user.id, 24*60*60)
  res.statusCode = 200
  res.send({"token": token})
}

Async function getDisconnect(req, res){
  const token = req.headers['X-Token']
  const user = await redisClient.get("auth_"+token)

  if (user !== null){
    await redisClient.del("auth_"+token)
    res.statusCode = 204
    res.end()
  }
  res.statusCode = 401
  throw new Error("Unauthorized")
}
