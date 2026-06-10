import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  creator: string;
  members: string[];
  createdAt: Date;
  messages: ChatMessage[];
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly STORAGE_KEY = 'volleyball-groups';
  private readonly CHANNEL_NAME = 'volleyball-chat';
  groups = signal<Group[]>([]);
  private channel!: BroadcastChannel;

  constructor() {
    this.loadGroups();
    this.initBroadcastChannel();
  }

  private initBroadcastChannel(): void {
    try {
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        console.log(' BroadcastChannel message:', event.data);
        // Nachrichten von anderen Tabs empfangen
        if (event.data.type === 'message') {
          this.addMessageLocally(event.data.groupId, event.data.message);
        }
        if (event.data.type === 'group-updated') {
          this.loadGroups();
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel nicht unterstützt, Chat funktioniert nur in diesem Tab');
    }
  }

  // ── Gruppen ──────────────────────────────────────────────────
  private loadGroups(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const restored = parsed.map((g: any) => ({
          ...g,
          createdAt: new Date(g.createdAt),
          messages: g.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        this.groups.set(restored);
      }
    } catch (err) {
      console.error('Fehler beim Laden von Gruppen:', err);
    }
  }

  private saveGroups(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.groups()));
    // Andere Tabs benachrichtigen
    try {
      this.channel?.postMessage({ type: 'group-updated' });
    } catch {}
  }

  createGroup(name: string, creator: string, description?: string): Group {
    if (!name.trim()) {
      throw new Error('Gruppenname erforderlich');
    }

    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      creator,
      members: [creator],
      createdAt: new Date(),
      messages: [],
      avatar: this.getAvatarEmoji(),
    };

    this.groups.update((groups) => [...groups, newGroup]);
    this.saveGroups();
    return newGroup;
  }

  getGroupById(groupId: string): Group | undefined {
    return this.groups().find((g) => g.id === groupId);
  }

  getUserGroups(username: string): Group[] {
    return this.groups().filter((g) => g.members.includes(username));
  }

  // ── Members ──────────────────────────────────────────────────
  addMember(groupId: string, username: string, requesterUsername: string): void {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Gruppe nicht gefunden');

    if (group.creator !== requesterUsername) {
      throw new Error('Nur der Creator kann Member hinzufügen');
    }

    if (group.members.includes(username)) {
      throw new Error('User ist bereits Member');
    }

    group.members.push(username);
    this.saveGroups();
  }

  removeMember(groupId: string, username: string, requesterUsername: string): void {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Gruppe nicht gefunden');

    // Member können sich selbst entfernen oder Creator kann sie entfernen
    if (requesterUsername !== username && group.creator !== requesterUsername) {
      throw new Error('Berechtigung erforderlich');
    }

    group.members = group.members.filter((m) => m !== username);
    this.saveGroups();
  }

  deleteGroup(groupId: string, username: string): void {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Gruppe nicht gefunden');

    if (group.creator !== username) {
      throw new Error('Nur der Creator kann die Gruppe löschen');
    }

    this.groups.update((groups) => groups.filter((g) => g.id !== groupId));
    this.saveGroups();
  }

  // ── Messages ─────────────────────────────────────────────────
  sendMessage(groupId: string, username: string, text: string): ChatMessage {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Gruppe nicht gefunden');

    if (!group.members.includes(username)) {
      throw new Error('Du bist kein Member dieser Gruppe');
    }

    if (!text.trim()) {
      throw new Error('Nachricht darf nicht leer sein');
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      text: text.trim(),
      timestamp: new Date(),
      avatar: this.getUserAvatar(username),
    };

    group.messages.push(message);
    this.saveGroups();

    // Nachricht an andere Tabs broadcasten
    try {
      this.channel?.postMessage({
        type: 'message',
        groupId,
        message,
      });
    } catch {}

    return message;
  }

  private addMessageLocally(groupId: string, message: ChatMessage): void {
    const group = this.getGroupById(groupId);
    if (group && !group.messages.some((m) => m.id === message.id)) {
      group.messages.push(message);
      this.groups.set([...this.groups()]); // Trigger signal update
    }
  }

  getMessages(groupId: string): ChatMessage[] {
    const group = this.getGroupById(groupId);
    return group?.messages || [];
  }

  // ── Helpers ──────────────────────────────────────────────────
  private getAvatarEmoji(): string {
    const emojis = ['', '️', '', '', '', '', ''];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  private getUserAvatar(username: string): string {
    // Jeder User bekommt konsistenten Avatar basierend auf username
    const emojis = ['', '', '', '', '', '', ''];
    const hash = username.charCodeAt(0) + username.charCodeAt(username.length - 1);
    return emojis[hash % emojis.length];
  }

  ngOnDestroy(): void {
    try {
      this.channel?.close();
    } catch {}
  }
}
