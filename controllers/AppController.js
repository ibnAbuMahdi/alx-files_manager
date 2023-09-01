import redisClient from '../utils/redis';

function getStatus(req, res){
  if (redisClient.isAlive()){
    res.statusCode = 200;
    res.send({ "redis": redisClient.isAlive() }); // TODO: db
  }
}

function getStats(req, res){
  //TODO: db
  res.statusCode = 200;
  res.send({"users": 12, "files": 1231});
}


export { getStatus, getStats };
