import { Component, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GroupService, Group, ChatMessage } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnDestroy {

  //  inject() aus @angular/core → verfügbar bei Field-Initialisierung
  private auth                = inject(AuthService);
  private groupService        = inject(GroupService);
  private notificationService = inject(NotificationService);

  //  currentUsername sofort mit echtem Wert befüllen
  currentUsername = signal(this.auth.currentUser()?.username ?? '');

  //  groups direkt vom Service — reaktives Signal
  groups = this.groupService.groups;

  //  userGroups reagiert sofort auf currentUsername UND groups-Änderungen
  userGroups = computed(() =>
    this.groupService.getUserGroups(this.currentUsername())
  );

  // UI State
  selectedGroup     = signal<Group | null>(null);
  showNewGroupForm  = signal(false);
  showAddMemberForm = signal(false);
  messageText       = signal('');
  newGroupName      = signal('');
  newGroupDesc      = signal('');
  addMemberUsername = signal('');
  error             = signal('');

  private lastMessageCount = 0;
  private channel!: BroadcastChannel;

  constructor() {
    this.initBroadcastChannelListener();

    //  effect() im Constructor → korrekter Injection Context
    effect(() => {
      const group = this.selectedGroup();
      if (group) {
        const currentCount = group.messages.length;
        if (currentCount > this.lastMessageCount) {
          const newMessages = group.messages.slice(this.lastMessageCount);
          newMessages.forEach((msg) => {
            if (msg.username !== this.currentUsername()) {
              this.notificationService.newMessage(group.name, msg.username);
            }
          });
        }
        this.lastMessageCount = currentCount;
      }
    });
  }

  ngOnDestroy(): void {
    try { this.channel?.close(); } catch {}
  }

  private initBroadcastChannelListener(): void {
    try {
      this.channel = new BroadcastChannel('volleyball-chat');
      this.channel.onmessage = (event) => {
        if (event.data.type === 'message') {
          const msg = event.data.message as ChatMessage;
          if (msg.username !== this.currentUsername()) {
            const group = this.groupService.getGroupById(event.data.groupId);
            if (group) {
              this.notificationService.newMessage(group.name, msg.username);
            }
          }
        }
      };
    } catch {
      console.warn('BroadcastChannel nicht verfügbar');
    }
  }

  // ── Gruppen-Management ───────────────────────────────────────
  createNewGroup(): void {
    try {
      this.error.set('');
      if (!this.newGroupName().trim()) {
        this.error.set('Gruppenname erforderlich');
        return;
      }
      const group = this.groupService.createGroup(
        this.newGroupName(),
        this.currentUsername(),
        this.newGroupDesc()
      );
      this.newGroupName.set('');
      this.newGroupDesc.set('');
      this.showNewGroupForm.set(false);
      this.selectGroup(group);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler');
    }
  }

  selectGroup(group: Group): void {
    this.selectedGroup.set(group);
    this.lastMessageCount = group.messages.length;
  }

  deleteGroup(): void {
    if (!this.selectedGroup() || !confirm('Gruppe wirklich löschen?')) return;
    try {
      this.groupService.deleteGroup(this.selectedGroup()!.id, this.currentUsername());
      this.selectedGroup.set(null);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler');
    }
  }

  // ── Members-Management ───────────────────────────────────────
  addMember(): void {
    try {
      this.error.set('');
      if (!this.selectedGroup()) return;
      if (!this.addMemberUsername().trim()) {
        this.error.set('Username erforderlich');
        return;
      }
      this.groupService.addMember(
        this.selectedGroup()!.id,
        this.addMemberUsername(),
        this.currentUsername()
      );
      this.addMemberUsername.set('');
      this.showAddMemberForm.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler');
    }
  }

  removeMember(username: string): void {
    if (!this.selectedGroup()) return;
    try {
      this.groupService.removeMember(
        this.selectedGroup()!.id,
        username,
        this.currentUsername()
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler');
    }
  }

  // ── Chat ─────────────────────────────────────────────────────
  sendMessage(): void {
    try {
      this.error.set('');
      if (!this.selectedGroup() || !this.messageText().trim()) return;
      this.groupService.sendMessage(
        this.selectedGroup()!.id,
        this.currentUsername(),
        this.messageText()
      );
      this.messageText.set('');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Fehler');
    }
  }

  getGroupMessages(): ChatMessage[] {
    if (!this.selectedGroup()) return [];
    return this.groupService.getMessages(this.selectedGroup()!.id);
  }

  // ── Helpers ──────────────────────────────────────────────────
  isCreator(group: Group): boolean {
    return group.creator === this.currentUsername();
  }

  isMember(group: Group): boolean {
    return group.members.includes(this.currentUsername());
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    if (d.toDateString() === new Date().toDateString()) return 'Heute';
    return d.toLocaleDateString('de-DE', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }
}
