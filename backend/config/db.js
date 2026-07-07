import mongoose from 'mongoose';

let isConnected = false;

// Register listeners for connection state modifications
mongoose.connection.on('connected', () => {
    isConnected = true;
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
    isConnected = false;
});

mongoose.connection.on('reconnected', () => {
    console.log('💚 MongoDB reconnected.');
    isConnected = true;
});

export const connectDB = async (mongoUri) => {
    if (!mongoUri) {
        console.warn('⚠️ MONGO_URI environment variable not set. Running in OFFLINE MODE.');
        isConnected = false;
        return false;
    }

    try {
        // Set serverSelectionTimeoutMS to 5000 to timeout fast if Atlas cluster is unreachable
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log('💚 MongoDB connected successfully.');
        return true;
    } catch (err) {
        // Check for IP Whitelist rejection pattern
        const isIpBlocked = err.name === 'MongooseServerSelectionError' || 
                            err.message.includes('IP') || 
                            err.message.includes('whitelist') || 
                            err.message.includes('connection blocked') || 
                            err.message.includes('Could not connect to any servers');

        if (isIpBlocked) {
            console.error('\n⚠️  MongoDB Atlas connection blocked — this is likely an IP Whitelist issue.');
            console.error('⚠️  Go to MongoDB Atlas → Network Access → Add Current IP Address (or 0.0.0.0/0 for dev).');
            console.error('⚠️  Falling back to offline mode in the meantime — reading/writing backend/data.json\n');
        } else {
            console.warn('⚠️ MongoDB connection failed. Running in OFFLINE MODE.');
            console.warn(`Reason: ${err.message}`);
        }
        isConnected = false;
        return false;
    }
};

export const isMongoConnected = () => {
    return isConnected && mongoose.connection.readyState === 1;
};
