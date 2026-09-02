import { MongoClient } from "mongodb";

let client = null;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not set in environment variables.");
    }

    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }

    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected.");
    return client;
};

export default connectDB;