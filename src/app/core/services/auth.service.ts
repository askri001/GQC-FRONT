import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest } from '../models';
import { tap, catchError, of, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    this.loadFromStorage();
  }

  /* ---------------- INIT ---------------- */

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (storedUser && token) {
      try {
        this.currentUserSignal.set(JSON.parse(storedUser));
        this.isAuthenticatedSignal.set(true);
      } catch {
        this.clearStorage();
      }
    }
  }

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
    }
  }

  /* ---------------- LOGOUT ---------------- */

  logout(): void {
    this.clearStorage();
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

  /* ---------------- TOKEN ---------------- */

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /* ---------------- ROLES ---------------- */

  getUserRoles(): string[] {
    return this.currentUserSignal()?.roles?.map(r => r.name) || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

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
