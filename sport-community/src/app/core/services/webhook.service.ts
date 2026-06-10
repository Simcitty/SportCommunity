import { Injectable } from '@angular/core';
import { VolleyballEvent, EventParticipant } from './event.service';
import { NotificationService } from './notification.service';

export interface WebhookPayload {
  type: 'event.created' | 'event.joined' | 'event.cancelled';
  timestamp: Date;
  data: {
    event: VolleyballEvent;
    user?: string; // username des Users der die Action gemacht hat
    message?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class WebhookService {
  private webhookUrl = 'http://localhost:3000/webhooks/events'; // Beispiel URL
  private listeners: Map<string, ((payload: WebhookPayload) => void)[]> = new Map();

  constructor(private notificationService: NotificationService) {}

  /**
   * Subscribe zu Webhook-Events
   * @param type 'event.created' | 'event.joined' | 'event.cancelled'
   * @param callback Funktion die aufgerufen wird
   */
  subscribe(type: string, callback: (payload: WebhookPayload) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
  }

  /**
   * Webhook feuern (lokal + optional an Backend + Browser Notification)
   */
  trigger(payload: WebhookPayload): void {
    console.log(' Webhook triggered:', payload.type, payload);

    // Lokale Listener aufrufen
    const callbacks = this.listeners.get(payload.type) || [];
    callbacks.forEach((cb) => cb(payload));

    // Browser Notifications anzeigen
    this.showNotificationForType(payload);

    // Optional: An Backend senden (später wenn Backend vorhanden)
    this.sendToBackend(payload).catch(() => {
      // Backend nicht verfügbar, aber lokale Notifications funktionieren trotzdem
      console.log('ℹ️ Backend-Webhook konnte nicht gesendet werden, verwende lokale Notifications');
    });
  }

  private showNotificationForType(payload: WebhookPayload): void {
    switch (payload.type) {
      case 'event.created':
        this.notificationService.eventCreated(
          payload.data.user || 'Jemand',
          payload.data.event.courtName
        );
        break;
      case 'event.joined':
        this.notificationService.eventJoined(
          payload.data.user || 'Jemand',
          payload.data.event.courtName
        );
        break;
      case 'event.cancelled':
        this.notificationService.eventCancelled(payload.data.event.courtName);
        break;
    }
  }

  /**
   * Event erstellt
   */
  eventCreated(event: VolleyballEvent): void {
    this.trigger({
      type: 'event.created',
      timestamp: new Date(),
      data: {
        event,
        user: event.creator,
        message: `${event.creator} hat ein neues Event erstellt: ${event.courtName} am ${event.date.toLocaleDateString('de-DE')}`,
      },
    });
  }

  /**
   * User zusagen - Webhook für Ersteller
   */
  eventJoined(event: VolleyballEvent, participant: EventParticipant): void {
    this.trigger({
      type: 'event.joined',
      timestamp: new Date(),
      data: {
        event,
        user: participant.username,
        message: `${participant.username} (${participant.level}) hat einem Event zugesagt: ${event.courtName}`,
      },
    });
  }

  /**
   * Event abgesagt
   */
  eventCancelled(event: VolleyballEvent, reason?: string): void {
    this.trigger({
      type: 'event.cancelled',
      timestamp: new Date(),
      data: {
        event,
        user: event.creator,
        message: `Event abgesagt: ${event.courtName} am ${event.date.toLocaleDateString('de-DE')}${
          reason ? ` - Grund: ${reason}` : ''
        }`,
      },
    });
  }

  /**
   * Webhook an Backend senden (für Zukunft)
   */
  private sendToBackend(payload: WebhookPayload): Promise<Response> {
    return fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: payload.timestamp.toISOString(),
      }),
    });
  }
}
