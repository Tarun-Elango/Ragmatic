import mongoose from 'mongoose';

const dbUri = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(dbUri, {});
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};

export default connectDB;
