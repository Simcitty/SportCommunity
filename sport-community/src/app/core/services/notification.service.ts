import { Injectable } from '@angular/core';

export interface BrowserNotification {
  title: string;
  options?: NotificationOptions;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private isEnabled = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    if ('Notification' in window) {
      this.isEnabled = true;
      console.log('Browser Notifications unterstützt');
    } else {
      console.warn('Browser Notifications nicht unterstützt');
    }
  }

  async requestPermission(): Promise<NotificationPermission | null> {
    if (!this.isEnabled) return null;

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (err) {
        console.error('Fehler beim Anfordern der Notification-Berechtigung:', err);
        return null;
      }
    }

    return null;
  }

  show(title: string, options?: NotificationOptions): void {
    if (!this.isEnabled || Notification.permission !== 'granted') {
      return;
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'sportcom-notification',
        ...options,
      };

      new Notification(title, defaultOptions);
    } catch (err) {
      console.error('Fehler beim Anzeigen der Notification:', err);
    }
  }

  eventCreated(eventName: string, courtName: string): void {
    this.show('Neues Event erstellt', {
      body: `${eventName} hat ein Event auf ${courtName} erstellt`,
      tag: `event-created-${Date.now()}`,
    });
  }

  eventJoined(username: string, courtName: string): void {
    this.show('Event beigetreten', {
      body: `${username} ist deinem Event auf ${courtName} beigetreten`,
      tag: `event-joined-${Date.now()}`,
    });
  }

  eventCancelled(courtName: string): void {
    this.show('Event storniert', {
      body: `Ein Event auf ${courtName} wurde storniert`,
      tag: `event-cancelled-${Date.now()}`,
    });
  }

  newMessage(groupName: string, username: string): void {
    this.show('Neue Nachricht', {
      body: `${username} hat in "${groupName}" geschrieben`,
      tag: `message-${groupName}-${Date.now()}`,
    });
  }

  customNotification(title: string, message: string): void {
    this.show(title, {
      body: message,
      tag: `custom-${Date.now()}`,
    });
  }
}
