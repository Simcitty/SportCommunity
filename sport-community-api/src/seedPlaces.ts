import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Place } from './models/Place';

dotenv.config();

const viennaCourts = [
  {
    name: 'Vienna City Beach Club (VCBC)',
    sport_type: 'Volleyball',
    latitude: 48.2177,
    longitude: 16.4292,
    description: 'Beliebte Location an der Neuen Donau mit Gastro und feinem Sand. Kostenpflichtig.'
  },
  {
    name: 'Beachvolleyballplatz Donauinsel (U6)',
    sport_type: 'Volleyball',
    latitude: 48.2425,
    longitude: 16.4021,
    description: 'Nahe der U6-Station Neue Donau. Teilweise öffentlich und kostenlos zugänglich.'
  },
  {
    name: 'Sportcenter Donaucity',
    sport_type: 'Volleyball',
    latitude: 48.2366,
    longitude: 16.4172,
    description: 'Top präparierte Plätze direkt bei der U1 Alte Donau. Online buchbar.'
  },
  {
    name: 'Prater Jesuitenwiese Beach-Courts',
    sport_type: 'Volleyball',
    latitude: 48.2031,
    longitude: 16.4005,
    description: 'Öffentliche Plätze im grünen Prater. Komplett kostenlos (Eigenes Netz/Ball empfohlen).'
  }
];

async function seedDatabase() {
  try {
    // Holt sich den Connect-String aus deiner .env Datei
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sport-community';
    await mongoose.connect(mongoUri);
    console.log('🌱 MongoDB-Verbindung für Seeding steht!');

    // Alte Plätze löschen, um Duplikate beim Testen zu vermeiden
    await Place.deleteMany({ sport_type: 'Volleyball' });

    // Plätze in die DB hämmern
    await Place.insertMany(viennaCourts);
    console.log('✅ Beachvolleyballplätze erfolgreich in MongoDB gespeichert!');
  } catch (error) {
    console.error('❌ Fehler beim Seeding:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
