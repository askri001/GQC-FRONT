import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest, Role } from '../models';
import { catchError, of, firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface CustomJwtPayload {
  sub?: string;
  username?: string;
  roles: string[];
  email?: string;
  firstName?: string;
  lastName?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedUserStr = localStorage.getItem(this.USER_KEY);
    const accessToken = this.getAccessToken();

    if (storedUserStr && accessToken) {
      try {
        const storedUser: User = JSON.parse(storedUserStr);
        this.currentUserSignal.set(storedUser);
        this.isAuthenticatedSignal.set(true);
      } catch {
        this.logout();
      }
    }
  }

  async login(credentials: LoginRequest): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('/auth/login', credentials).pipe(
          catchError(() => of(null as any))
        )
      );

      if (!response || !response.token) {
        throw new Error('Login response invalid');
      }

      localStorage.setItem(this.ACCESS_TOKEN_KEY, response.token);
      // Store the user id from the login response for profile access
      if (response.user?.id) {
        localStorage.setItem('auth_user_id', String(response.user.id));
      }
      this.updateUserFromToken(response.token);
      this.isAuthenticatedSignal.set(true);

      return true;
    } catch (error) {
      console.error('Login error', error);
      throw new Error('Identifiants invalides');
    }
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('auth_user_id');
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getUserRoles(): string[] {
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const payload = jwtDecode<CustomJwtPayload>(token);
      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      return roles.map((r: string) => r.startsWith('ROLE_') ? r : `ROLE_${r}`);
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    const priority = ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'];
    for (const role of priority) {
      if (roles.includes(role)) return role;
    }
    return roles[0] || null;
  }

  private updateUserFromToken(token: string): void {
    try {
      const payload = jwtDecode<CustomJwtPayload>(token);
      const user: User = {
        username: payload.sub || payload.username || '',
        email: payload.email || '',
        firstName: payload.firstName || payload.given_name || '',
        lastName: payload.family_name || payload.lastName || '',
        active: true,
        roles: (payload.roles || []).map((r: string) => ({
          name: r.startsWith('ROLE_') ? r : `ROLE_${r}`
        } as Role))
      };
      this.currentUserSignal.set(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Token decode error:', error);
    }
  }
}
