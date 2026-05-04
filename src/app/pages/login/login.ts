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
<<<<<<< Updated upstream
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
=======
  templateUrl: './login.html',
>>>>>>> Stashed changes
  styleUrls: ['./login.css']
})
export class LoginComponent {

  username = '';
  password = '';

  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin() {

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login({
        username: this.username,
        password: this.password
      });

      // Redirect based on role
      const role = this.authService.getPrimaryRole();
      if (role === 'ROLE_CHARGEDOSSIER') {
        this.router.navigate(['/dossiers']);
      } else {
        this.router.navigate(['/dashboard']);
      }

    } catch (err: any) {
      this.errorMessage.set(err.message || 'Identifiants invalides');
    } finally {
      this.loading.set(false);
    }
  }
}