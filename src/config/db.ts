import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  if (!dbName) {
    throw new Error('MONGO_DB_NAME is not defined in environment variables')
  }

  await mongoose.connect(mongoUri, {
    dbName: dbName,
  })

  console.log('Connected to MongoDB')
  console.log('Database name:', mongoose.connection.name)
  console.log('Ready state:', mongoose.connection.readyState)
}