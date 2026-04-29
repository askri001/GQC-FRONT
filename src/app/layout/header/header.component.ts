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
          <mat-icon [matBadge]="3" matBadgeColor="warn" matBadgeSize="small" aria-hidden="false">notifications</mat-icon>
        </button>

        <button mat-icon-button class="header-btn" matTooltip="Messages">
          <mat-icon [matBadge]="5" matBadgeColor="primary" matBadgeSize="small" aria-hidden="false">mail</mat-icon>
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
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  pageTitle = input<string>('BNA Bank');

  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}

