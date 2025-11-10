import mongoose from "mongoose";

// cache mongodb connection for serverless
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// reuse connection across hot reloads
let cached: MongooseConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// connect to mongodb with pooling and auto reconnect
async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    // Only show this in verbose mode to avoid spam
    if (process.env.VERBOSE_LOGS === 'true') {
      console.log("✅ Using cached MongoDB connection");
    }
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "❌ MONGODB_URI is not defined in environment variables. " +
      "Please add it to your .env.local file."
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4,
    };

    // Parse MongoDB URI to show sanitized connection info
    let connectionInfo = 'MongoDB';
    try {
      const url = new URL(process.env.MONGODB_URI);
      const host = url.hostname;
      const isAtlas = host.includes('mongodb.net');
      const dbName = url.pathname.split('/')[1]?.split('?')[0] || 'default';
      connectionInfo = isAtlas 
        ? `MongoDB Atlas (DB: ${dbName})`
        : `${host} (DB: ${dbName})`;
    } catch {
      // Fallback if URI parsing fails
    }

    console.log(`🔄 Connecting to ${connectionInfo}...`);
    
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log(`✅ Successfully connected to ${connectionInfo}`);
        console.log(`   Connection pool: ${opts.minPoolSize}-${opts.maxPoolSize} connections`);
        return mongoose;
      })
      .catch((error) => {
        console.error(`❌ Failed to connect to ${connectionInfo}`);
        console.error("   Error:", error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

// graceful shutdown in production
if (process.env.NODE_ENV === "production") {
  process.on("SIGINT", async () => {
    if (cached.conn) {
      await cached.conn.connection.close();
      console.log("🔌 MongoDB connection closed due to app termination");
      process.exit(0);
    }
  });
}

export default connectToDatabase;

// check if connected
export function isConnected(): boolean {
  return cached.conn !== null && mongoose.connection.readyState === 1;
}

// disconnect from mongodb
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await cached.conn.connection.close();
    cached.conn = null;
    cached.promise = null;
    console.log("🔌 MongoDB connection closed");
  }
}
