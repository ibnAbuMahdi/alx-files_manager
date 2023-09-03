import redisClient from '../utils/redis'
import dbClient from '../utils/db'

async function getShow(req, res){
  const fileId = req.params['id'];
  const token = req.headers['X-Token']
  const user_id = await redisClient.get("auth_"+token)
  
  if (user_id === null) {
    res.statusCode = 401
    throw new Error("Unauthorized")
  }
  const file = await dbClient.client.collection('files').findOne({'userId': user_id, 'id': fileId});
  if (file === null){
    res.statusCode = 401
    throw new Error("Unauthorized")
  }
  res.send(file)
}

async function getIndex(req, res){
    const token = req.headers['X-Token']
    const user_id = await redisClient.get("auth_"+token)
    if (user_id === null) {
      res.statusCode = 401
      throw new Error("Unauthorized")
    }

    const parentId = req.query['parentId']
    const page = req.query['page']
    const folder = await dbClient.client.collection('files').findOne({'id': parentId || 0, 'type': 'folder'})
    if (folder === null){
        res.send([])
    }
    const skipped = 0
    if (page > 0) skipped = page * 20 - 1
    const files = await dbClient.client.collection('files').aggregate([
        {$match: {'parentId': parentId}},
        {$skip: skipped },
        {$limit: 20}
    ])
    res.send(files)
}

export { getShow, getIndex }
