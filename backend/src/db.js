import { MongoClient } from 'mongodb';

export async function prepareDatabase(db) {
  await Promise.all([
    db.collection('inquiries').createIndex({ reference: 1 }, { unique: true }),
    db.collection('inquiries').createIndex({ idempotencyKey: 1 }, { unique: true }),
    db.collection('inquiries').createIndex({ status: 1, createdAt: -1 }),
    db.collection('inquiries').createIndex({ outboxPending: 1, createdAt: 1 }),
    db.collection('inquiries').createIndex({ email: 1, status: 1 }),
    db.collection('notificationJobs').createIndex({ dedupeKey: 1 }, { unique: true }),
    db.collection('notificationJobs').createIndex({ status: 1, nextAttemptAt: 1 }),
    db.collection('submissionLimits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

export async function connectDatabase(config) {
  const client = new MongoClient(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
  try {
    await client.connect();
    const db = client.db(config.MONGODB_DB);
    await prepareDatabase(db);
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}
