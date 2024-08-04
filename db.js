import { MongoClient } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI; // Use your connection string here

let client;
let db;

async function connectToDatabase() {
  if (!client || !client.isConnected()) {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db('your_database_name'); // Replace with your database name
  }
  return db;
}

export { connectToDatabase };