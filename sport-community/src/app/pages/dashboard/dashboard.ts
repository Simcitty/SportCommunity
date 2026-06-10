import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { EventService, VolleyballEvent } from '../../core/services/event.service';
import { GroupService } from '../../core/services/group.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {

  //  computed() statt signal() → reagiert automatisch wenn Events sich ändern
  upcomingEvents = computed(() => {
    const now = new Date();
    return this.eventService.events()
      .filter((e) => new Date(e.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  });

  userGroups = computed(() => {
    const user = this.auth.currentUser();
    if (!user?.username) return [];
    return this.groupService.getUserGroups(user.username);
  });

  eventStats = computed(() => ({
    total:      this.eventService.events().length,
    upcoming:   this.upcomingEvents().length,
    userJoined: this.eventService.events().filter(
      e => e.participants.some(p => p.username === this.auth.currentUser()?.username)
    ).length,
  }));

  constructor(
    public auth: AuthService,
    private eventService: EventService,
    private groupService: GroupService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.requestNotificationPermission();
  }

  private requestNotificationPermission(): void {
    this.notificationService.requestPermission().then((permission) => {
      console.log('Notifications:', permission);
    });
  }

  logout(): void { this.auth.logout(); }
}
