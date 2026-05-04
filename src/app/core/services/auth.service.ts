import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
<<<<<<< Updated upstream
import { User, AuthResponse, LoginRequest } from '../models';
import { tap, catchError, of, firstValueFrom } from 'rxjs';
=======
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
>>>>>>> Stashed changes

@Injectable({
  providedIn: 'root'
})
export class AuthService {
<<<<<<< Updated upstream

  private readonly TOKEN_KEY = 'auth_token';
=======
  private readonly ACCESS_TOKEN_KEY = 'access_token';
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
    this.loadFromStorage();
  }

  /* ---------------- INIT ---------------- */

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (storedUser && token) {
=======
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedUserStr = localStorage.getItem(this.USER_KEY);
    const accessToken = this.getAccessToken();

    if (storedUserStr && accessToken) {
>>>>>>> Stashed changes
      try {
        const storedUser: User = JSON.parse(storedUserStr);
        this.currentUserSignal.set(storedUser);
        this.isAuthenticatedSignal.set(true);
      } catch {
<<<<<<< Updated upstream
        this.clearStorage();
=======
        this.logout();
>>>>>>> Stashed changes
      }
    }
  }

<<<<<<< Updated upstream
  /* ---------------- LOGIN ---------------- */

  async login(credentials: LoginRequest): Promise<boolean> {
    console.log('Attempting real login for:', credentials.username);

    // 🔥 REAL API LOGIN FIRST
    try {
      const response = await firstValueFrom(
        this.api.post<AuthResponse>('/auth/login', credentials)
      );
      console.log('Real login success');
      this.setAuth(response.token, response.user);
      return true;
    } catch (apiError) {
      console.error('Real API login failed:', apiError);
      
      // 🔥 MOCK FALLBACK (development only)
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        console.warn('Using MOCK auth fallback - real API failed');
        const mockUser: User = {
          id: 1,
          username: 'admin',
          email: 'admin@bna.tn',
          firstName: 'Admin',
          lastName: 'Super',
          active: true,
          roles: [
            {
              id: 1,
              name: 'ADMIN',
              permissions: [
                { id: 1, name: 'ALL', code: 'ALL', module: 'ALL' },
                { id: 2, name: 'CLIENT_CREATE', code: 'CLIENT_CREATE', module: 'CLIENT' }
              ]
            }
          ]
        };

        const mockToken = 'mock-jwt-admin-full-access';
        this.setAuth(mockToken, mockUser);
        return true;
      }
      
      throw new Error(`Backend login failed: ${(apiError as any)?.message || 'Service indisponible. Vérifiez le serveur Spring Boot.'}`);
=======
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

      this.updateUserFromToken(response.token);
      this.isAuthenticatedSignal.set(true);

      return true;
    } catch (error) {
      console.error('Login error', error);
      throw new Error('Identifiants invalides');
>>>>>>> Stashed changes
    }
  }

  /* ---------------- LOGOUT ---------------- */

  logout(): void {
<<<<<<< Updated upstream
    this.clearStorage();
=======
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

>>>>>>> Stashed changes
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

<<<<<<< Updated upstream
  /* ---------------- TOKEN ---------------- */

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
=======
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
>>>>>>> Stashed changes
  }

  /* ---------------- ROLES ---------------- */

  getUserRoles(): string[] {
<<<<<<< Updated upstream
    return this.currentUserSignal()?.roles?.map(r => r.name) || [];
=======
    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const payload = jwtDecode<CustomJwtPayload>(token);
      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      // Backend JWT embeds roles without ROLE_ prefix — prepend it here
      return roles.map((r: string) => r.startsWith('ROLE_') ? r : `ROLE_${r}`);
    } catch {
      return [];
    }
>>>>>>> Stashed changes
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

<<<<<<< Updated upstream
  hasPermission(code: string): boolean {
    const user = this.currentUserSignal();

    if (!user?.roles) return false;

    return user.roles.some(role =>
      role.permissions?.some(p => p.code === code)
    );
  }

  /* ---------------- REFRESH USER ---------------- */

  refreshUser(): void {
    this.api.get<User>('/auth/me')
      .pipe(
        tap(user => this.setAuth(this.getToken() || '', user)),
        catchError(() => of(null))
      )
      .subscribe();
=======
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
>>>>>>> Stashed changes
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
  }
}
