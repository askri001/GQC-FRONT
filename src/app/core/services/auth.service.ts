import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest } from '../models';
import { tap, catchError, of } from 'rxjs';

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
    // Load from localStorage on init
    const storedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (storedUser && token) {
      try {
        this.currentUserSignal.set(JSON.parse(storedUser));
        this.isAuthenticatedSignal.set(true);
      } catch {}
    }
  }

  login(credentials: LoginRequest): Promise<boolean> {
    // Mock login for development (admin/admin)
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      const mockToken = 'mock-jwt-token-dev';
      const mockUser: User = {
        id: 1,
        username: 'admin',
        email: 'admin@bna.tn',
        firstName: 'Admin',
        lastName: 'Super',
        active: true,
        roles: [{ 
          id: 1, 
          name: 'ADMIN', 
          permissions: [{ id: 1, name: 'ALL', code: 'ALL', module: 'ALL' }] 
        }]
      };
      this.storeToken(mockToken);
      this.storeUser(mockUser);
      this.currentUserSignal.set(mockUser);
      this.isAuthenticatedSignal.set(true);
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      this.api.post<AuthResponse>('/auth/login', credentials)
        .pipe(
          tap(response => {
            this.storeToken(response.token);
            this.storeUser(response.user);
            this.currentUserSignal.set(response.user);
            this.isAuthenticatedSignal.set(true);
            resolve(true);
          }),
          catchError(error => {
            reject(new Error('Identifiants invalides'));
            return of(null);
          })
        )
        .subscribe();
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRoles(): string[] {
    const user = this.currentUserSignal();
    return user?.roles?.map(r => r.name) || [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUserSignal();
    if (!user || !user.roles) return false;
    
    return user.roles.some(role => 
      role.permissions?.some(permission => permission.code === permissionCode)
    );
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  refreshUser(): void {
    this.api.get<User>('/auth/me')
      .pipe(
        tap(user => {
          this.storeUser(user);
          this.currentUserSignal.set(user);
        })
      )
      .subscribe();
  }
}
