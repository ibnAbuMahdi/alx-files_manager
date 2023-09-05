const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url);
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      await this.client.connect();
      const db = this.client.db();
      const num = await db.collection('users').countDocuments();
      return num;
    } catch (err) {
      console.log(err);
    }
  }

  async nbFiles() {
    try {
      await this.client.connect();
      const db = this.client.db();
      const num = await db.collection('files').countDocuments();
      return num;
    } catch (err) {
      console.log(err);
    }
  }
}

const dbClient = new DBClient();

export default dbClient;
