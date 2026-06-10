import { Router, Request, Response } from 'express';
import { Place } from '../models/Place';

const router = Router();

// GET /api/places -> Gibt alle Sportplätze zurück
router.get('/', async (req: Request, res: Response) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Abrufen der Plätze' });
  }
});

export default router;
