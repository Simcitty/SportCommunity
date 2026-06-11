import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt?: Date;
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

interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sc_auth_token';
  private readonly USER_KEY  = 'sc_user';

  // Angular Signals for reactive state
  currentUser = signal<User | null>(this._loadUser());
  isLoggedIn  = signal<boolean>(!!this._loadToken());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ── Login ─────────────────────────────────────────
  async login(payload: LoginPayload): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${environment.apiUrl}/auth/login`,
          payload,
        ),
      );

      if (!response) {
        throw new Error('Keine Antwort vom Server');
      }

      this._persist(response.access_token, response.user);
    } catch (err) {
      const message = this._getErrorMessage(err);
      throw new Error(message);
    }
  }

  // ── Register ──────────────────────────────────────
  async register(payload: RegisterPayload): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${environment.apiUrl}/auth/register`,
          payload,
        ),
      );

      if (!response) {
        throw new Error('Keine Antwort vom Server');
      }

      this._persist(response.access_token, response.user);
    } catch (err) {
      const message = this._getErrorMessage(err);
      throw new Error(message);
    }
  }

  // ── Logout ────────────────────────────────────────
  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/auth/login']);
  }

  // ── Get Token ─────────────────────────────────────
  getToken(): string | null {
    return this._loadToken();
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

  private _getErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message || err.statusText || 'Ein Fehler ist aufgetreten';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Ein unbekannter Fehler ist aufgetreten';
  }
}
