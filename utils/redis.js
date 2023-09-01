import redis from 'redis'
import { promisify } from 'util'

class RedisClient{
  constructor(){
    this.client = redis.createClient();
    this.client.on('error', (err)=>{
      if (err) console.log(err);
    });
  }

  isAlive(){
    return this.client.connected;
  }

  async get(key){
    const asyncGet = promisify(this.client.get).bind(this.client);
    const val = await asyncGet(key);
    return val;
  }

  async set(key, value, duration){
    const asyncSetex = promisify(this.client.setex).bind(this.client);
    await asyncSetex(key, duration, value);
  }

  async del(key){
    const asyncDel = promisify(this.client.del).bind(this.client);
    await asyncDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
