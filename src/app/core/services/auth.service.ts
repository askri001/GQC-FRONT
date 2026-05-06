import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
<<<<<<< Updated upstream
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
=======
import { User, AuthResponse, LoginRequest } from '../models';
import { tap, catchError, of, firstValueFrom } from 'rxjs';
>>>>>>> Stashed changes

@Injectable({
  providedIn: 'root'
})
export class AuthService {
<<<<<<< Updated upstream
  private readonly ACCESS_TOKEN_KEY = 'access_token';
=======

  private readonly TOKEN_KEY = 'auth_token';
>>>>>>> Stashed changes
  private readonly USER_KEY = 'auth_user';

  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  constructor(
    private api: ApiService,
    private router: Router
  ) {
<<<<<<< Updated upstream
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedUserStr = localStorage.getItem(this.USER_KEY);
    const accessToken = this.getAccessToken();

    if (storedUserStr && accessToken) {
=======
    this.loadFromStorage();
  }

  /* ---------------- INIT ---------------- */

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    // Reject stale mock tokens — they start with 'mock-'
    if (!token || token.startsWith('mock-')) {
      this.clearStorage();
      return;
    }

    if (storedUser && token) {
>>>>>>> Stashed changes
      try {
        const user: User = JSON.parse(storedUser);
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } catch {
<<<<<<< Updated upstream
        this.logout();
=======
        this.clearStorage();
>>>>>>> Stashed changes
      }
    }
  }

<<<<<<< Updated upstream
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
=======
  /* ---------------- LOGIN ---------------- */

  async login(credentials: LoginRequest): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.api.post<any>('/auth/login', credentials)
      );

      // Map backend DTO → Angular User model
      // Backend roles are strings like "ROLE_ADMIN"
      const mappedUser: User = {
        id: response.user?.id,
        username: response.user?.username,
        email: response.user?.email,
        firstName: response.user?.prenom || response.user?.firstName || '',
        lastName: response.user?.nom   || response.user?.lastName  || '',
        active: true,
        roles: [...new Set<string>(response.user?.roles || [])]   // deduplicate
          .map((r: any) => ({
            name: typeof r === 'string' ? r : r.name,
            permissions: []
          }))
      };
>>>>>>> Stashed changes

      this.setAuth(response.token, mappedUser);
      return true;
<<<<<<< Updated upstream
    } catch (error) {
      console.error('Login error', error);
      throw new Error('Identifiants invalides');
=======
    } catch (apiError: any) {
      const msg = apiError?.error?.message
        || apiError?.message
        || 'Identifiants incorrects ou serveur indisponible.';
      throw new Error(msg);
>>>>>>> Stashed changes
    }
  }

  logout(): void {
<<<<<<< Updated upstream
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('auth_user_id');
=======
    this.clearStorage();
>>>>>>> Stashed changes
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

<<<<<<< Updated upstream
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
=======
  /* ---------------- TOKEN ---------------- */

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
>>>>>>> Stashed changes
  }

  getUserRoles(): string[] {
<<<<<<< Updated upstream
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const payload = jwtDecode<CustomJwtPayload>(token);
      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      return roles.map((r: string) => r.startsWith('ROLE_') ? r : `ROLE_${r}`);
    } catch {
      return [];
    }
=======
    const roles = this.currentUserSignal()?.roles?.map(r => r.name) || [];
    // Normalize: ensure both "ADMIN" and "ROLE_ADMIN" formats are covered
    const normalized: string[] = [];
    roles.forEach(r => {
      normalized.push(r);
      if (!r.startsWith('ROLE_')) normalized.push(`ROLE_${r}`);
    });
    return normalized;
>>>>>>> Stashed changes
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

<<<<<<< Updated upstream
  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    const priority = ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'];
=======
  hasPermission(code: string): boolean {
    const user = this.currentUserSignal();
    if (!user?.roles) return false;
    return user.roles.some(role =>
      role.permissions?.some(p => p.code === code)
    );
  }

  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    const priority = ['ADMIN', 'ROLE_ADMIN', 'RESPONSABLE', 'ROLE_RESPONSABLE', 'CHARGEDOSSIER', 'ROLE_CHARGEDOSSIER'];
>>>>>>> Stashed changes
    for (const role of priority) {
      if (roles.includes(role)) return role;
    }
    return roles[0] || null;
  }

<<<<<<< Updated upstream
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
=======
  /* ---------------- REFRESH USER ---------------- */

  refreshUser(): void {
    this.api.get<User>('/auth/me')
      .pipe(
        tap(user => this.setAuth(this.getToken() || '', user)),
        catchError(() => of(null))
      )
      .subscribe();
  }

  /* ---------------- HELPERS ---------------- */

  private setAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
>>>>>>> Stashed changes
  }
}
