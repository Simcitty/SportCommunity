import { Component, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, VolleyballEvent } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth';
import { WebhookService, WebhookPayload } from '../../core/services/webhook.service';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Notifications Toast -->
    @if (notifications().length > 0) {
      <div class="notifications-container">
        @for (notification of notifications(); track notification) {
          <div class="notification-toast">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7 12a5 5 0 1 1 10 0A5 5 0 0 1 7 12z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            {{ notification }}
          </div>
        }
      </div>
    }

    <div class="dialog-backdrop" (click)="handleBackdropClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <button class="dialog-close" (click)="closeDialog()"></button>

        @if (mode() === 'create') {
          <div class="dialog-content">
            <h3>Volleyballtraining erstellen</h3>

            <div class="form-group">
              <label>Dein Username</label>
              <input [(ngModel)]="form.username" placeholder="z.B. Max" />
            </div>

            <div class="form-group">
              <label>Dein Level</label>
              <select [(ngModel)]="form.level">
                <option value="anfänger">Anfänger</option>
                <option value="fortgeschritten">Fortgeschritten</option>
                <option value="profi">Profi</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Datum</label>
                <input type="date" [min]="minDate()" [(ngModel)]="form.date" />
              </div>
              <div class="form-group">
                <label>Uhrzeit</label>
                <input type="time" [(ngModel)]="form.time" />
              </div>
            </div>

            <div class="form-group">
              <label>Max. Spieler</label>
              <input type="number" min="2" max="24" [(ngModel)]="form.maxPlayers" />
            </div>

            <div class="form-group">
              <label>Beschreibung (optional)</label>
              <textarea
                [(ngModel)]="form.description"
                placeholder="z.B. Anfängerfreundlich, Sand ist neu"
                rows="3"
              ></textarea>
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <div class="dialog-actions">
              <button class="btn btn-secondary" (click)="closeDialog()">Abbrechen</button>
              <button class="btn btn-primary" (click)="submitCreate()">Event erstellen</button>
            </div>
          </div>
        }

        @if (mode() === 'events') {
          <div class="dialog-content">
            <h3>{{ courtName() }} - Events</h3>

            @if (events().length === 0) {
              <p class="empty-state">Keine Events geplant. Erstelle das erste!</p>
            } @else {
              <div class="events-list">
                @for (event of events(); track event.id) {
                  <div class="event-card">
                    <div class="event-header">
                      <h4>{{ event.date | date: 'dd.MM.yyyy' }} um {{ event.time }} Uhr</h4>
                      @if (isCreator(event)) {
                        <button class="btn-delete" (click)="deleteEvent(event.id)" title="Event löschen">
                          Löschen
                        </button>
                      }
                    </div>

                    <div class="event-meta">
                      <span class="creator-badge">Ersteller: {{ event.creator }}</span>
                      <span class="level-badge" [class]="'level-' + event.creatorLevel">
                        {{ event.creatorLevel }}
                      </span>
                      <span class="player-count">
                        {{ event.participants.length }}/{{ event.maxPlayers }} Spieler
                      </span>
                    </div>

                    @if (event.description) {
                      <p class="event-description">{{ event.description }}</p>
                    }

                    <div class="participants-list">
                      <h5>Teilnehmer:</h5>
                      <ul>
                        @for (p of event.participants; track p.username) {
                          <li>
                            <span class="username">{{ p.username }}</span>
                            <span class="level" [class]="'level-' + p.level">{{ p.level }}</span>
                          </li>
                        }
                      </ul>
                    </div>

                    <div class="event-actions">
                      @if (canJoin(event)) {
                        <button class="btn btn-accent" (click)="openJoinForm(event)">
                          Zusagen
                        </button>
                      } @else if (hasJoined(event)) {
                        <button class="btn btn-danger" (click)="leaveEvent(event.id)">
                          Abmelden
                        </button>
                      } @else if (isFull(event)) {
                        <span class="event-full">Voll</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <div class="dialog-actions">
              <button class="btn btn-primary" (click)="openCreateForm()">
                + Event erstellen
              </button>
              <button class="btn btn-secondary" (click)="closeDialog()">Schließen</button>
            </div>
          </div>
        }

        @if (mode() === 'join') {
          <div class="dialog-content">
            <h3>Zusagen für Training</h3>
            <p class="event-date">
              {{ selectedEvent()!.date | date: 'EEEE, dd.MM.yyyy' }} um
              {{ selectedEvent()!.time }} Uhr
            </p>

            <div class="form-group">
              <label>Dein Username</label>
              <input [(ngModel)]="joinForm.username" placeholder="z.B. Max" />
            </div>

            <div class="form-group">
              <label>Dein Level</label>
              <select [(ngModel)]="joinForm.level">
                <option value="anfänger">Anfänger</option>
                <option value="fortgeschritten">Fortgeschritten</option>
                <option value="profi">Profi</option>
              </select>
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <div class="dialog-actions">
              <button class="btn btn-secondary" (click)="openEventsForm()">Zurück</button>
              <button class="btn btn-primary" (click)="submitJoin()">Zusagen</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1001;
      max-width: 320px;
    }

    .notification-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(75, 255, 156, 0.1);
      border: 1px solid rgba(75, 255, 156, 0.3);
      border-radius: 6px;
      color: #4bff9c;
      font-size: 0.85rem;
      font-weight: 600;
      animation: slideIn 0.3s ease;

      svg {
        flex-shrink: 0;
        color: #4bff9c;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog {
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-radius: 12px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .dialog-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      color: var(--clr-muted);
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 1;
    }

    .dialog-content {
      padding: 24px;
    }

    h3 {
      margin: 0 0 16px;
      font-size: 1.3rem;
      color: var(--clr-text);
    }

    h4 {
      margin: 0;
      font-size: 1rem;
      color: var(--clr-accent);
    }

    h5 {
      margin: 8px 0 6px;
      font-size: 0.9rem;
      color: var(--clr-text);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--clr-text);
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 8px 10px;
      background: var(--clr-bg);
      border: 1px solid var(--clr-border);
      border-radius: 6px;
      color: var(--clr-text);
      font-family: inherit;
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: var(--clr-accent);
        background: rgba(232, 255, 71, 0.02);
      }
    }

    textarea {
      resize: vertical;
    }

    .error-message {
      padding: 10px;
      margin-bottom: 16px;
      background: rgba(255, 75, 75, 0.1);
      border: 1px solid rgba(255, 75, 75, 0.3);
      border-radius: 6px;
      color: #ff7a7a;
      font-size: 0.85rem;
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--clr-muted);
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
      max-height: 400px;
      overflow-y: auto;
    }

    .event-card {
      padding: 12px;
      background: var(--clr-bg);
      border: 1px solid var(--clr-border);
      border-radius: 8px;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      opacity: 0.6;
      transition: opacity 0.2s;
      padding: 4px 10px;
      color: #ff7a7a;

      &:hover {
        opacity: 1;
      }
    }

    .event-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
      font-size: 0.75rem;
    }

    .creator-badge,
    .level-badge,
    .player-count {
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(232, 255, 71, 0.08);
      color: var(--clr-accent);
    }

    .level-anfänger {
      background: rgba(75, 192, 192, 0.1);
      color: #4bc0c0;
    }

    .level-fortgeschritten {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }

    .level-profi {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .event-description {
      font-size: 0.85rem;
      color: var(--clr-muted);
      margin: 8px 0;
      font-style: italic;
    }

    .participants-list {
      margin: 8px 0;

      ul {
        list-style: none;
        padding: 0;
        margin: 4px 0 0;
        font-size: 0.8rem;

        li {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          color: var(--clr-text);

          .username {
            font-weight: 600;
          }

          .level {
            padding: 1px 4px;
            border-radius: 3px;
            background: rgba(232, 255, 71, 0.08);
            color: var(--clr-accent);
            font-size: 0.7rem;
          }
        }
      }
    }

    .event-actions {
      display: flex;
      gap: 8px;
    }

    .event-full {
      display: flex;
      align-items: center;
      font-size: 0.8rem;
      color: var(--clr-muted);
    }

    .event-date {
      font-size: 0.95rem;
      color: var(--clr-accent);
      margin: 0 0 16px;
      font-weight: 600;
    }

    .dialog-actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }

    .btn {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
      }
    }

    .btn-primary {
      background: var(--clr-accent);
      color: #0a0b0e;

      &:hover {
        background: var(--clr-accent-dim);
      }
    }

    .btn-secondary {
      background: var(--clr-bg);
      color: var(--clr-text);
      border: 1px solid var(--clr-border);

      &:hover {
        background: rgba(232, 255, 71, 0.05);
      }
    }

    .btn-accent {
      background: rgba(232, 255, 71, 0.15);
      color: var(--clr-accent);
      border: 1px solid rgba(232, 255, 71, 0.3);
      flex: 1;

      &:hover {
        background: rgba(232, 255, 71, 0.25);
      }
    }

    .btn-danger {
      background: rgba(255, 75, 75, 0.1);
      color: #ff7a7a;
      border: 1px solid rgba(255, 75, 75, 0.3);
      flex: 1;

      &:hover {
        background: rgba(255, 75, 75, 0.2);
      }
    }
  `],
})
export class EventDialogComponent implements OnInit {
  mode = signal<'create' | 'events' | 'join'>('events');
  events = signal<VolleyballEvent[]>([]);
  courtName = signal('');
  courtId = signal('');
  selectedEvent = signal<VolleyballEvent | null>(null);
  error = signal('');
  currentUsername = signal('');
  notifications = signal<string[]>([]);

  @Output() close = new EventEmitter<void>();

  form = {
    username: '',
    level: 'anfänger' as const,
    date: '',
    time: '19:00',
    maxPlayers: 8,
    description: '',
  };

  joinForm = {
    username: '',
    level: 'anfänger' as const,
  };

  constructor(
    private eventService: EventService,
    private auth: AuthService,
    private webhookService: WebhookService,
  ) {
    this.setupWebhooks();
  }

  ngOnInit(): void {
    // Username vom Login nehmen
    const currentUser = this.auth.currentUser();
    if (currentUser?.username) {
      this.currentUsername.set(currentUser.username);
    }
  }

  private setupWebhooks(): void {
    // Webhook: Event erstellt
    this.webhookService.subscribe('event.created', (payload: WebhookPayload) => {
      const msg = payload.data.message || 'Neues Event erstellt';
      this.addNotification(msg);
    });

    // Webhook: User zugesagt
    this.webhookService.subscribe('event.joined', (payload: WebhookPayload) => {
      const msg = payload.data.message || 'User hat zugesagt';
      this.addNotification(msg);
    });

    // Webhook: Event abgesagt
    this.webhookService.subscribe('event.cancelled', (payload: WebhookPayload) => {
      const msg = payload.data.message || 'Event wurde abgesagt';
      this.addNotification(msg);
    });
  }

  private addNotification(message: string): void {
    this.notifications.update((notifications) => [...notifications, message]);
    // Notification nach 5 Sekunden entfernen
    setTimeout(() => {
      this.notifications.update((notifications) => notifications.slice(1));
    }, 5000);
  }

  minDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  openCreate(courtId: string, courtName: string): void {
    this.courtId.set(courtId);
    this.courtName.set(courtName);
    this.mode.set('events');
    this.loadEvents();
  }

  openCreateForm(): void {
    this.mode.set('create');
    this.form = {
      username: this.currentUsername(),
      level: 'anfänger',
      date: this.minDate(),
      time: '19:00',
      maxPlayers: 8,
      description: '',
    };
    this.error.set('');
  }

  openEventsForm(): void {
    this.mode.set('events');
    this.loadEvents();
  }

  openJoinForm(event: VolleyballEvent): void {
    this.selectedEvent.set(event);
    this.mode.set('join');
    this.joinForm = { username: this.currentUsername(), level: 'anfänger' };
    this.error.set('');
  }

  submitCreate(): void {
    try {
      this.error.set('');

      if (!this.form.username.trim()) {
        this.error.set('Username erforderlich');
        return;
      }

      const eventDate = new Date(this.form.date);

      this.eventService.createEvent({
        courtId: this.courtId(),
        courtName: this.courtName(),
        creator: this.form.username,
        creatorLevel: this.form.level,
        date: eventDate,
        time: this.form.time,
        description: this.form.description,
        maxPlayers: this.form.maxPlayers,
      });

      this.currentUsername.set(this.form.username);
      this.openEventsForm();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    }
  }

  submitJoin(): void {
    try {
      this.error.set('');

      if (!this.joinForm.username.trim()) {
        this.error.set('Username erforderlich');
        return;
      }

      if (!this.selectedEvent()) {
        this.error.set('Event nicht gefunden');
        return;
      }

      this.eventService.joinEvent(
        this.selectedEvent()!.id,
        this.joinForm.username,
        this.joinForm.level
      );

      this.currentUsername.set(this.joinForm.username);
      this.openEventsForm();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler beim Zusagen');
    }
  }

  deleteEvent(eventId: string): void {
    if (confirm('Event wirklich löschen?')) {
      try {
        this.eventService.deleteEvent(eventId, this.currentUsername());
        this.loadEvents();
      } catch (err) {
        this.error.set(err instanceof Error ? err.message : 'Fehler beim Löschen');
      }
    }
  }

  leaveEvent(eventId: string): void {
    try {
      this.eventService.leaveEvent(eventId, this.currentUsername());
      this.loadEvents();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler beim Abmelden');
    }
  }

  loadEvents(): void {
    this.events.set(this.eventService.getEventsByCourt(this.courtId()));
  }

  canJoin(event: VolleyballEvent): boolean {
    return (
      !this.hasJoined(event) &&
      !this.isFull(event) &&
      event.creator !== this.currentUsername() &&
      this.currentUsername() !== ''
    );
  }

  hasJoined(event: VolleyballEvent): boolean {
    return event.participants.some((p) => p.username === this.currentUsername());
  }

  isFull(event: VolleyballEvent): boolean {
    return event.participants.length >= event.maxPlayers;
  }

  isCreator(event: VolleyballEvent): boolean {
    return event.creator === this.currentUsername();
  }

  closeDialog(): void {
    this.close.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
