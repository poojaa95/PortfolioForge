import mongoose from 'mongoose'

// Connects to MongoDB using the MONGO_URI from .env
const connectDB = async () => {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not defined in .env')

  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  console.log(`MongoDB connected: ${conn.connection.host}`)
  return conn
}

export default connectDB
