import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest } from '../models';
import { tap, catchError, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSignal = signal<User | null>(this.getStoredUser());
  private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  // Mock users for demo - BNA Tunisia
  private mockUsers: { username: string; password: string; user: User }[] = [
    {
      username: 'admin',
      password: 'admin123',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@bna.tn',
        firstName: 'Admin',
        lastName: 'BNA',
        active: true,
        roles: [{ id: 1, name: 'ADMIN', permissions: [] }]
      }
    },
    {
      username: 'user',
      password: 'user123',
      user: {
        id: 2,
        username: 'user',
        email: 'utilisateur@bna.tn',
        firstName: 'Utilisateur',
        lastName: 'BNA',
        active: true,
        roles: [{ id: 2, name: 'USER', permissions: [] }]
      }
    }
  ];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Check for mock login first
      const mockUser = this.mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (mockUser) {
        // Mock successful login
        this.storeToken('mock-jwt-token-' + Date.now());
        this.storeUser(mockUser.user);
        this.currentUserSignal.set(mockUser.user);
        this.isAuthenticatedSignal.set(true);
        resolve(true);
        return;
      }

      // Try API login
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
            console.error('Login error:', error);
            reject(error);
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

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!token;
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

