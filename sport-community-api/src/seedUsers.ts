import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';

dotenv.config();

const testUsers = [
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  },
  {
    username: 'anna',
    email: 'anna@schule.at',
    password: 'Hollabrunn2026!',
  },
  {
    username: 'maximilian',
    email: 'max@schule.at',
    password: 'SportCommunity2026',
  },
];

async function seedUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sport-community';
    await mongoose.connect(mongoUri);
    console.log('MongoDB-Verbindung zum User-Seeding steht!');

    // Alte Test-User löschen um Duplikate zu vermeiden
    await User.deleteMany({
      email: { $in: testUsers.map(u => u.email) },
    });

    // Test-User mit gehashten Passwörtern erstellen
    const hashedUsers = await Promise.all(
      testUsers.map(async (u) => ({
        username: u.username,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 12),
      })),
    );

    const created = await User.insertMany(hashedUsers);
    console.log(`${created.length} Test-User erfolgreich erstellt!`);
    console.log('\nTest-Credentials:');
    testUsers.forEach(u => {
      console.log(`   Email: ${u.email}, Password: ${u.password}`);
    });
  } catch (error) {
    console.error('Fehler beim User-Seeding:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
