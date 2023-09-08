import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getShow(req, res) {
  const fileId = req.param('id');
  const token = req.header('X-Token');
  const userId = await redisClient.get(`auth_${token}`);

  if (userId === null) {
    res.statusCode = 401;
    res.send({ error: 'Unauthorized' });
  }
  await dbClient.client.connect();
  const db = dbClient.client.db(process.env.DB_DATABASE || 'files_manager');
  const file = await db.collection('files').findOne({ userId, id: fileId });
  if (file === null) {
    res.statusCode = 401;
    res.send({ error: 'Unauthorized' });
  }
  res.send(file);
}

async function getIndex(req, res) {
  const token = req.header('X-Token');
  const userId = await redisClient.get(`auth_${token}`);
  if (userId === null) {
    res.statusCode = 401;
    res.send({ error: 'Unauthorized' });
  }
  await dbClient.client.connect();
  const db = dbClient.client.db(process.env.DB_DATABASE || 'files_manager');
  const { parentId } = req.query;
  const { page } = req.query;
  const folder = await db.collection('files').findOne({ id: parentId || 0, type: 'folder' });
  if (folder === null) {
    res.send([]);
  }
  let skipped = 0;
  if (page > 0) skipped = page * 20 - 1;
  const files = await dbClient.client.collection('files').aggregate([
    { $match: { parentId } },
    { $skip: skipped },
    { $limit: 20 },
  ]);
  res.send(files);
}

async function postUpload(req, res) {
  const {
    name, type, data,
  } = req.body;
  let { parentId, isPublic } = req.body;
  await dbClient.client.connect();
  const db = dbClient.client.db(process.env.DB_DATABASE || 'files_manager');
  const token = req.header('X-Token');
  const userId = await redisClient.get(`auth_${token}`);
  if (userId === null) {
    res.statusCode = 401;
    res.send({ error: 'Unauthorized' });
  }
  if (!name) {
    res.statusCode = 400;
    res.send({ error: 'Missing name' });
  }
  if (!type || !['folder', 'file', 'image'].includes(type)) {
    res.statusCode = 400;
    res.send({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    res.statusCode = 400;
    res.send({ error: 'Missing data' });
  }
  if (parentId) {
    const prnt = await db.collection('files').findOne({ _id: ObjectId(parentId) });
    if (!prnt) {
      res.statusCode = 400;
      res.send({ error: 'Parent not found' });
    }
    if (prnt.type !== 'folder') {
      res.statusCode = 400;
      res.send({ error: 'Parent is not a folder' });
    }
  }
  if (!parentId) parentId = 0;
  if (!isPublic) isPublic = false;
  if (type === 'folder') {
    const folder = {
      name, type, parentId, isPublic, userId,
    };
    const result = await db.collection('files').insertOne(folder);
    res.statusCode = 201;
    const folderDoc = {
      id: result.ops[0]._id.toString(), userId, name, type, parentId, isPublic,
    };
    res.send(folderDoc);
  }
  let path = process.env.FOLDER_PATH !== null ? process.env.FOLDER_PATH : '/tmp/files_manager';
  path = `${path}/${uuidv4()}`;
  fs.writeFile(path, data);
  const file = {
    name, localPath: path, type, parentId, isPublic, userId,
  };
  const result = await db.collection('files').insertOne(file);
  const fileDoc = {
    id: result.ops[0]._id.toString(), userId, name, type, parentId, isPublic,
  };
  res.statusCode = 201;
  res.send(fileDoc);
}

async function getFile(req, res) {
  const fileId = req.params.id;
  await dbClient.client.connect();
  const db = dbClient.client.db(process.env.DB_DATABASE || 'files_manager');
  const file = await db.collection('files').findOne({ _id: ObjectId(fileId) });
  if (file === null) {
    res.statusCode = 404;
    res.send('Not found');
  }
  const token = req.header('X-Token');
  const noAuth = token === null;
  const userId = await redisClient.get(`auth_${token.toString()}`);
  const notOwner = file.userId !== userId;
  if (!file.isPublic && (noAuth || notOwner)) {
    res.statusCode = 404;
    res.send('Not found');
  }

  if (file.type === 'folder') {
    res.statusCode = 400;
    res.send("A folder doesn't have content");
  }

  if (!fs.existsSync(file.localPath)) {
    res.statusCode = 404;
    res.send('Not found');
  }

  res.contentType(mime.lookup(file.name));
  res.send(file.data);
}

export {
  getShow, getIndex, postUpload, getFile,
};
