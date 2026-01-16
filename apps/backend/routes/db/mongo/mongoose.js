import mongoose from 'mongoose';

// Support both connection string formats:
// 1. Full MONGODB_URI (for Vercel/serverless)
// 2. Individual credentials (legacy)
const uri = process.env.MONGODB_URI ||
    `mongodb+srv://${process.env.BAI_MONGODB_USERNAME}:${process.env.BAI_MONGODB_PASSWORD}@uif-dev.jzffidd.mongodb.net/${process.env.BAI_BAI_MONGODB_DATABASE}?retryWrites=true&w=majority`;

// Cache connection for serverless environments
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connect() {
    // Return existing connection if available
    if (cached.conn) {
        return cached.conn;
    }

    if (mongoose.connection.readyState === 1) {
        console.log('Connection exists');
        cached.conn = mongoose.connection;
        return mongoose.connection;
    }

    if (!cached.promise) {
        const opts = {
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
            minPoolSize: 1, // Lower for serverless
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log('Mongoose connected');
            return mongoose.connection;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error('MongoDB:', error.message);
        throw error;
    }
}

async function disconnect() {
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3 || mongoose.connection.readyState === 99) {
        await mongoose.close();
        console.log("Connection closed");
    }
}

export { connect, disconnect };