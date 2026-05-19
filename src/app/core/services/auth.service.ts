import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import { catchError, of, firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { AuthResponse, LoginRequest, Role, User } from '../models';


interface CustomJwtPayload {
  sub?: string;
  username?: string;
  roles?: string[];
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
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSignal    = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  // Store token in a signal so computed roles re-run after login
  private tokenSignal           = signal<string | null>(localStorage.getItem(this.ACCESS_TOKEN_KEY));

  currentUser     = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  // ── Reactive roles — recomputed on login/logout ───────────────
  private userRoles = computed<string[]>(() => {
    const _user  = this.currentUserSignal(); // reactive dependency
    const token  = this.tokenSignal();       // reactive dependency
    if (token) {
      try {
        const payload = jwtDecode<CustomJwtPayload>(token);
        const roles = Array.isArray(payload.roles) ? payload.roles : [];
        return roles.map((r: string) => (r.startsWith('ROLE_') ? r : `ROLE_${r}`));
      } catch { /* fall through */ }
    }
    const rolesFromUser = _user?.roles?.map(r => r.name) || [];
    const normalized: string[] = [];
    rolesFromUser.forEach(r => {
      normalized.push(r);
      if (!r.startsWith('ROLE_')) normalized.push(`ROLE_${r}`);
    });
    return normalized;
  });

  constructor(
    private api: ApiService,
    private router: Router,
    private wsService: WebSocketService
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const storedUserStr = localStorage.getItem(this.USER_KEY);
    const accessToken = this.getAccessToken();

    if (storedUserStr && accessToken) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY) || this.getAccessToken();

    if (!token || token.startsWith('mock-')) {
      this.clearStorage();
      return;
    }

    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } catch {
        this.logout();
        this.clearStorage();
      }
    }
  }

  //isAuthenticated(): boolean {
    //return this.isAuthenticatedSignal();
  //}

  async login(credentials: LoginRequest): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.api.post<AuthResponse>('/auth/login', credentials));

      if (!response || !(response as any).token) {
        throw new Error('Login response invalid');
      }

      // Your backend seems to return a `token` field.
      const token = (response as any).token as string;

      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
      if ((response as any).user?.id) {
        localStorage.setItem('auth_user_id', String((response as any).user.id));
      }

      // Prefer user object from backend if present.
      const userFromApi: User | null = (response as any).user
        ? {
            id: (response as any).user.id,
            username: (response as any).user.username,
            email: (response as any).user.email,
            firstName: (response as any).user.prenom || (response as any).user.firstName || '',
            lastName: (response as any).user.nom || (response as any).user.lastName || '',
            active: true,
            roles: [...new Set<string>((response as any).user.roles || [])].map((r: any) => ({
              name: typeof r === 'string' ? r : r.name,
              permissions: []
            })) as Role[]
          }
        : null;

      if (userFromApi) {
        this.setAuth(token, userFromApi);
        this.wsService.connect(token, userFromApi.username || '');
      } else {
        this.updateUserFromToken(token);
        const username = this.currentUserSignal()?.username || '';
        this.wsService.connect(token, username);
      }

      return true;
    } catch (error: any) {
      const msg = error?.error?.message || error?.message || 'Identifiants invalides';
      throw new Error(msg);
    }
  }

  logout(): void {
    this.wsService.disconnect();
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('auth_user_id');

    this.clearStorage();
    this.tokenSignal.set(null);           // ← triggers userRoles recompute
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);

    this.router.navigate(['/login']);
  }

  logoutWithMessage(message: string): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('auth_user_id');

    this.clearStorage();
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);

    this.router.navigate(['/login'], { state: { sessionMessage: message } });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || this.getAccessToken();
  }

  getUserRoles(): string[] {
    return this.userRoles();
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  getPrimaryRole(): string | null {
    const roles = this.getUserRoles();
    const priority = [
      'ADMIN',
      'ROLE_ADMIN',
      'RESPONSABLE',
      'ROLE_RESPONSABLE',
      'CHARGEDOSSIER',
      'ROLE_CHARGEDOSSIER'
    ];

    for (const role of priority) {
      if (roles.includes(role)) return role;
    }

    return roles[0] || null;
  }

  hasPermission(code: string): boolean {
    const user = this.currentUserSignal();
    if (!user?.roles) return false;

    return user.roles.some(role =>
      role.permissions?.some(p => p.code === code)
    );
  }

  refreshUser(): void {
    this.api
      .get<User>('/auth/me')
      .pipe(
        // backend may return a user; token is already stored
        catchError(() => of(null as any))
      )
      .subscribe(user => {
        if (!user) return;
        const token = this.getToken() || '';
        this.setAuth(token, user);
      });
  }

  private updateUserFromToken(token: string): void {
    try {
      const payload = jwtDecode<CustomJwtPayload>(token);
      const user: User = {
        username: payload.sub || payload.username || '',
        email: payload.email || '',
        firstName: payload.firstName || payload.given_name || '',
        lastName: payload.lastName || payload.family_name || '',
        active: true,
        roles: (payload.roles || []).map((r: string) => ({
          name: r.startsWith('ROLE_') ? r : `ROLE_${r}`
        })) as Role[]
      };

      this.currentUserSignal.set(user);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      // ignore
    }
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);

    this.tokenSignal.set(token);          // ← triggers userRoles recompute
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

