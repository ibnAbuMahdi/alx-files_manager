import redisClient from '../utils/redis'
import dbClient from '../utils/db'
import { ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

async function getShow(req, res){
  const fileId = req.param('id');
  const token = req.header('X-Token')
  const user_id = await redisClient.get("auth_"+token)
  
  if (user_id === null) {
    res.statusCode = 401
    res.send({"error": "Unauthorized"})
  }
  await dbClient.client.connect()
  const db = dbClient.client.db(process.env['DB_DATABASE'] || 'files_manager')
  const file = await db.collection('files').findOne({'userId': user_id, 'id': fileId});
  if (file === null){
    res.statusCode = 401
    res.send({"error": "Unauthorized"})
  }
  res.send(file)
}

async function getIndex(req, res){
    const token = req.header('X-Token')
    const user_id = await redisClient.get("auth_"+token)
    if (user_id === null) {
      res.statusCode = 401
      res.send({"error": "Unauthorized"})
    }
    await dbClient.client.connect()
    const db = dbClient.client.db(process.env['DB_DATABASE'] || 'files_manager')
    const parentId = req.query['parentId']
    const page = req.query['page']
    const folder = await db.collection('files').findOne({'id': parentId || 0, 'type': 'folder'})
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

async function getUpload(req, res){
    const { name, type, parentId, isPublic, data } = req.body
    await dbClient.client.connect()
    const db = dbClient.client.db(process.env['DB_DATABASE'] || 'files_manager')
    const token = req.header('X-Token')
    const userId = await redisClient.get("auth_"+token)
    if (userId === null) {
      res.statusCode = 401
      res.send({"error": "Unauthorized"})
    }  
    if (!name){
      res.statusCode = 400
      res.send({"error": "Missing name"})
    }
    if (!type || !["folder", "file", "image"].includes(type)){
      res.statusCode = 400
      res.send({"error": "Missing type"})
    }
    if (!data && type !== "folder"){
      res.statusCode = 400
      res.send({"error": "Missing data"})
    }
    if (parentId){
      const prnt = await db.collection('files').findOne({_id: ObjectId(parentId)})
      if(!prnt){
        res.statusCode = 400
        res.send({"error": "Parent not found"})
      }
      if (prnt.type !== "folder"){
        res.statusCode = 400
        res.send({"error": "Parent is not a folder"})
      }
    }
    if(!parentId) parentId = 0
    if(!isPublic) isPublic = false
    if (type === "folder"){
      const folder = {name, type, parentId, isPublic, userId}
      const result = await db.collection('files').insertOne(folder)
      res.statusCode = 201
      const folderDoc = {id: result.ops[0]._id.toString(), userId, name, type, parentId, isPublic}
      res.send(folderDoc)
    }
    let path = process.env['FOLDER_PATH']??"/tmp/files_manager"
    path = path+'/'+uuidv4()
    fs.writeFile(path, data)
    const file = {name, type, parentId, isPublic, data, userId}
    const result = await db.collection('files').insertOne(file)
    const fileDoc = {id: result.ops[0]._id.toString(), userId, name, type, parentId, isPublic}
    res.statusCode = 201
    res.send(fileDoc)
}
export { getShow, getIndex, getUpload }
