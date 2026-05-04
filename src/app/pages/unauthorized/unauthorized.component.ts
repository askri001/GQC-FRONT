import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-icon class="error-icon">lock</mat-icon>
      <h1>Accès refusé</h1>
      <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      <button mat-raised-button color="primary" (click)="goHome()">
        <mat-icon>home</mat-icon>
        Retour à l'accueil
      </button>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
      text-align: center;
      padding: 24px;
    }

    .error-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #c62828;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #212121;
      margin: 0;
    }

    p {
      font-size: 16px;
      color: #616161;
      max-width: 400px;
      margin: 0;
    }
  `]
})
export class UnauthorizedComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goHome(): void {
    const role = this.authService.getPrimaryRole();
    this.router.navigate([role === 'ROLE_CHARGEDOSSIER' ? '/dossiers' : '/dashboard']);
  }
}
