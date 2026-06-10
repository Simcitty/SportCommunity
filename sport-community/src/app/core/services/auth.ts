import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sc_auth_token';
  private readonly USER_KEY  = 'sc_user';

  // Angular Signals for reactive state
  currentUser = signal<User | null>(this._loadUser());
  isLoggedIn  = signal<boolean>(!!this._loadToken());

  constructor(private router: Router) {}

  // ── Login ─────────────────────────────────────────
  async login(payload: LoginPayload): Promise<void> {
    // TODO: replace with real HTTP call → POST /api/auth/login
    await this._simulateRequest(900);

    const mockUser: User = {
      id: '1',
      username: payload.email.split('@')[0],
      email: payload.email,
      createdAt: new Date(),
    };
    const mockToken = btoa(JSON.stringify({ userId: mockUser.id, exp: Date.now() + 86400000 }));

    this._persist(mockToken, mockUser);
  }

  // ── Register ──────────────────────────────────────
  async register(payload: RegisterPayload): Promise<void> {
    // TODO: replace with real HTTP call → POST /api/auth/register
    await this._simulateRequest(1200);

    const mockUser: User = {
      id: Date.now().toString(),
      username: payload.username,
      email: payload.email,
      createdAt: new Date(),
    };
    const mockToken = btoa(JSON.stringify({ userId: mockUser.id, exp: Date.now() + 86400000 }));

    this._persist(mockToken, mockUser);
  }

  // ── Logout ────────────────────────────────────────
  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/auth/login']);
  }

  // ── Helpers ───────────────────────────────────────
  private _persist(token: string, user: User): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
  }

  private _loadToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private _loadUser(): User | null {
    const raw = sessionStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private _simulateRequest(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
