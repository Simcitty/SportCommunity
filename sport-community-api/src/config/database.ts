import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI!;
  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB verbunden: ${uri}`);
  } catch (error) {
    console.error('❌ MongoDB Verbindungsfehler:', error);
    process.exit(1);
  }
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB Verbindung getrennt');
  });
};
