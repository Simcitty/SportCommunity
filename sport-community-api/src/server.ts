import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import placeRoutes from './routes/place.routes';

const app  = express();
const PORT = process.env.PORT ?? 3000;

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL ?? 'http://localhost:4200',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/places', placeRoutes);

// Health-Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route nicht gefunden' });
});

// ── Server starten ────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`📡 Angular erwartet auf ${process.env.CLIENT_URL}`);
  });
};

start();
