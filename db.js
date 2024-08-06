import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;

let client;

/* connect_to_database
opens a connection to the mongo database.
note: requires the MongoURI environment variable to be set!
also requires that the IP of the connecting server is whitelisted!
*/
async function connect_to_database() {
  if (!client) {
    client = new MongoClient(uri, { });
    await client.connect();
  }
  return client.db('Meals');
}

/* close_database
closes the connection to the mongo database
*/
async function close_database() {
  if (client) {
    await client.close();
    client = null;
  }
}

export { connect_to_database, close_database, uri };
