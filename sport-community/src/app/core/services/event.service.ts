import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { WebhookService } from './webhook.service';

export interface EventParticipant {
  username: string;
  level: 'anfänger' | 'fortgeschritten' | 'profi';
  joinedAt: Date;
}

export interface VolleyballEvent {
  id: string;
  courtId: string;
  courtName: string;
  creator: string;
  creatorLevel: 'anfänger' | 'fortgeschritten' | 'profi';
  date: Date;
  time: string; // HH:MM format
  description?: string;
  maxPlayers: number;
  participants: EventParticipant[];
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly STORAGE_KEY = 'volleyball-events';
  events = signal<VolleyballEvent[]>([]);

  constructor(private webhookService: WebhookService) {
    this.loadEvents();
    this.cleanupOldEvents();
  }

  // ── Event laden ──────────────────────────────────────────────────
  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Konvertiere Datum-Strings zurück zu Date-Objekten
        const restored = parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
          participants: e.participants.map((p: any) => ({
            ...p,
            joinedAt: new Date(p.joinedAt),
          })),
        }));
        this.events.set(restored);
      }
    } catch (err) {
      console.error('Fehler beim Laden von Events:', err);
    }
  }

  // ── Events speichern ────────────────────────────────────────────
  private saveEvents(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events()));
  }

  // ── Alte Events löschen ─────────────────────────────────────────
  private cleanupOldEvents(): void {
    const now = new Date();
    const filtered = this.events().filter((event) => {
      const eventEnd = new Date(event.date);
      eventEnd.setDate(eventEnd.getDate() + 1); // Event ist sichtbar bis zum nächsten Tag
      return eventEnd > now;
    });
    if (filtered.length !== this.events().length) {
      this.events.set(filtered);
      this.saveEvents();
    }
  }

  // ── Event erstellen ─────────────────────────────────────────────
  createEvent(event: Omit<VolleyballEvent, 'id' | 'createdAt' | 'participants'>): VolleyballEvent {
    // Validierung: Event erst für morgen oder später
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < tomorrow) {
      throw new Error('Events können erst für morgen oder später erstellt werden');
    }

    const newEvent: VolleyballEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants: [
        {
          username: event.creator,
          level: event.creatorLevel,
          joinedAt: new Date(),
        },
      ],
      createdAt: new Date(),
    };

    this.events.update((events) => [...events, newEvent]);
    this.saveEvents();

    // Webhook triggern
    this.webhookService.eventCreated(newEvent);

    return newEvent;
  }

  // ── Event für Platz holen ───────────────────────────────────────
  getEventsByCourt(courtId: string): VolleyballEvent[] {
    return this.events().filter((e) => e.courtId === courtId);
  }

  // ── User zusagen ────────────────────────────────────────────────
  joinEvent(eventId: string, username: string, level: 'anfänger' | 'fortgeschritten' | 'profi'): void {
    const event = this.events().find((e) => e.id === eventId);
    if (!event) throw new Error('Event nicht gefunden');

    // Prüfe ob User der Ersteller ist
    if (event.creator === username) {
      throw new Error('Du kannst nicht zu deinem eigenen Event zusagen');
    }

    // Prüfe ob User bereits dabei ist
    if (event.participants.some((p) => p.username === username)) {
      throw new Error('Du hast bereits zugesagt');
    }

    // Prüfe ob User bereits zu dieser Zeit zugesagt hat (andere Events)
    const userAlreadyJoined = this.events().some(
      (e) =>
        e.id !== eventId &&
        e.date.toDateString() === event.date.toDateString() &&
        e.time === event.time &&
        e.participants.some((p) => p.username === username)
    );

    if (userAlreadyJoined) {
      throw new Error(
        'Du hast bereits zu dieser Zeit zugesagt (z.B. bei einem anderen Platz)'
      );
    }

    // Prüfe max Spieler
    if (event.participants.length >= event.maxPlayers) {
      throw new Error('Event ist voll');
    }

    const participant: EventParticipant = {
      username,
      level,
      joinedAt: new Date(),
    };

    event.participants.push(participant);
    this.saveEvents();

    // Webhook triggern - an Ersteller
    this.webhookService.eventJoined(event, participant);
  }

  // ── Von Event abmelden ──────────────────────────────────────────
  leaveEvent(eventId: string, username: string): void {
    const event = this.events().find((e) => e.id === eventId);
    if (!event) throw new Error('Event nicht gefunden');

    // Ersteller kann sich nicht abmelden
    if (event.creator === username) {
      throw new Error('Der Ersteller kann das Event nicht verlassen');
    }

    event.participants = event.participants.filter((p) => p.username !== username);
    this.saveEvents();
  }

  // ── Event löschen (nur Ersteller) ───────────────────────────────
  deleteEvent(eventId: string, username: string): void {
    const event = this.events().find((e) => e.id === eventId);
    if (!event) throw new Error('Event nicht gefunden');

    if (event.creator !== username) {
      throw new Error('Nur der Ersteller kann das Event löschen');
    }

    this.events.update((events) => events.filter((e) => e.id !== eventId));
    this.saveEvents();
  }

  // ── Alle Events für Karte holen ─────────────────────────────────
  getAllEvents(): VolleyballEvent[] {
    this.cleanupOldEvents();
    return this.events();
  }
}
