import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatDividerModule],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ pageTitle() }}</h1>
      </div>

      <div class="header-right">
        <button mat-icon-button class="header-btn" matTooltip="Notifications">
          <mat-icon [matBadge]="3" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
        </button>

        <button mat-icon-button class="header-btn" matTooltip="Messages">
          <mat-icon [matBadge]="5" matBadgeColor="primary" matBadgeSize="small">mail</mat-icon>
        </button>

        <div class="user-menu">
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <span class="user-name">{{ authService.currentUser()?.firstName || 'User' }}</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" class="user-dropdown">
            <div class="user-info">
              <mat-icon class="user-avatar-icon">account_circle</mat-icon>
              <div class="user-details">
                <span class="user-fullname">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
                <span class="user-email">{{ authService.currentUser()?.email }}</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Mon Profil</span>
            </button>
            <button mat-menu-item routerLink="/settings">
              <mat-icon>settings</mat-icon>
              <span>Paramètres</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Déconnexion</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 64px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      position: sticky;
      top: 0;
      z-index: 999;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #2e7d32;
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-btn {
      color: #666;
    }

    .header-btn:hover {
      color: #2e7d32;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 8px;
    }

    .user-btn:hover {
      background: rgba(46, 125, 50, 0.05);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .user-avatar-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #2e7d32;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-fullname {
      font-weight: 600;
      color: #333;
    }

    .user-email {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class HeaderComponent {
  pageTitle = input<string>('Dashboard');

  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}

