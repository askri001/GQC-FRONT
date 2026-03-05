import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-background">
        <div class="bg-pattern"></div>
      </div>
      
      <div class="login-content">
        <div class="login-header">
          <div class="logo">
            <mat-icon>account_balance</mat-icon>
          </div>
          <h1>BNA - Gestion de Contentieux</h1>
          <p>Banque Nationale Agricole - Système de Gestion des Litiges</p>
        </div>

        <mat-card class="login-card">
          <mat-card-content>
            <h2>Connexion BNA</h2>
            
            <form (ngSubmit)="onLogin()" class="login-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nom d'utilisateur</mat-label>
                <input matInput [(ngModel)]="username" name="username" required>
                <mat-icon matPrefix>person</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mot de passe</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" 
                       [(ngModel)]="password" name="password" required>
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix (click)="hidePassword.set(!hidePassword())" 
                        type="button">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              @if (errorMessage()) {
                <div class="error-message">
                  <mat-icon>error</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <button mat-raised-button color="primary" type="submit" 
                      class="login-btn" [disabled]="loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Se connecter
                }
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <div class="login-footer">
          <p>© 2024 BNA - Banque Nationale Agricole Tunisia</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      position: relative;
      overflow: hidden;
    }

    .login-background {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%);
    }

    .bg-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
    }

    .login-content {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 1;
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      backdrop-filter: blur(10px);
    }

    .logo mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #fff;
    }

    .login-header h1 {
      color: #fff;
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px;
    }

    .login-header p {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
      margin: 0;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .login-card h2 {
      margin: 0 0 24px;
      color: #333;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .login-btn {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      margin-top: 8px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
      font-size: 14px;
    }

    .login-footer {
      margin-top: 40px;
      color: rgba(255,255,255,0.5);
      font-size: 12px;
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 8px;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  hidePassword = signal(true);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage.set('Veuillez remplir tous les champs');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login({ username: this.username, password: this.password });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Identifiants invalides');
    } finally {
      this.loading.set(false);
    }
  }
}

