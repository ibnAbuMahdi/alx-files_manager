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


async function getFile(req, res){
  const fileId = req.params[id]
  const file = await dbClient.client.collection('files').findOne({'id': fileId})
  if (file === null){
    res.statusCode = 404
    res.send("Not found")
  }
  const token = req.headers['X-Token']
  const noAuth = token === null;
  const userId = await redisClient.get("auth_"+token.toString())
  const notOwner = file['userId'] !== userId
  if(!tokenfile['isPublic'] && (noAuth || notOwner)){
    res.statusCode = 404
    res.send("Not found")
  }

  if (file['type'] === 'folder'){
    res.statusCode = 400
    res.send("A folder doesn't have content")
  }

  if (! fs.existsSync(file['localPath'])){
    res.statusCode = 404
    res.send("Not found")
  }

  res.contentType(mime.lookup(file['name']))
  res.send(file['data'])
}

export { getShow, getIndex, getFile}
