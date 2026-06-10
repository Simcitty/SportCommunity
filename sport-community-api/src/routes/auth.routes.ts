import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ── Hilfsfunktion: JWT erstellen ──────────────────────────────────────
const signToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '24h' } as jwt.SignOptions,
  );
};

// ── POST /api/auth/register ───────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: 'Passwort muss mindestens 8 Zeichen haben' });
    return;
  }

  try {
    // E-Mail oder Username bereits vergeben?
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const field = exists.email === email ? 'E-Mail' : 'Benutzername';
      res.status(409).json({ message: `${field} ist bereits vergeben` });
      return;
    }

    // Passwort hashen (bcrypt, Faktor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({ username, email, passwordHash });
    const token = signToken(user.id);

    res.status(201).json({
      access_token: token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'E-Mail und Passwort erforderlich' });
    return;
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Kein Konto mit dieser E-Mail gefunden' });
      return;
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      res.status(401).json({ message: 'Falsches Passwort' });
      return;
    }

    const token = signToken(user.id);

    res.json({
      access_token: token,
      user,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────
router.post('/logout', authMiddleware, (_req: AuthRequest, res: Response): void => {
  // Bei reinem JWT-Ansatz reicht client-seitiges Löschen
  // Für Token-Blacklist: hier Redis/DB-Eintrag setzen
  res.json({ message: 'Erfolgreich abgemeldet' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User nicht gefunden' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Serverfehler' });
  }
});

export default router;
