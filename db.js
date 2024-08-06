import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;

let client;

/* 
 * function to connect to the MongoDB database
 * @returns {Promise<Object>} - the MongoDB database instance
 */
async function connect_to_database() {
  if (!client) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
  }
  return client.db('Meals');
}

/* 
 * function to close the MongoDB connection
 * @returns {Promise<void>}
 */
async function close_database() {
  if (client) {
    await client.close();
    client = null;
  }
}

export { connect_to_database, close_database, uri };
