import { Component, input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { MessageService } from '../../core/services/message.service';
import { ProfileDialogComponent } from '../../shared/profile-dialog/profile-dialog.component';
import { ComposeMessageDialogComponent } from '../../shared/compose-message-dialog/compose-message-dialog.component';
import { ViewMessageDialogComponent } from '../../shared/view-message-dialog/view-message-dialog.component';
import { Router } from '@angular/router';
import { Message } from '../../core/models/message.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatBadgeModule, MatDividerModule, MatDialogModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ pageTitle() }}</h1>
      </div>

      <div class="header-right">

        <!-- ── Notifications ── -->
        <button mat-icon-button class="header-btn"
          [matMenuTriggerFor]="notifMenu"
          (menuOpened)="notifService.load()"
          matTooltip="Notifications">
          @if (notifService.count > 0) {
            <mat-icon [matBadge]="notifService.count" matBadgeColor="warn" matBadgeSize="small">
              notifications
            </mat-icon>
          } @else {
            <mat-icon>notifications_none</mat-icon>
          }
        </button>

        <mat-menu #notifMenu="matMenu" class="notif-menu">
          <ng-template matMenuContent>
            <div class="notif-header" (click)="$event.stopPropagation()">
              <span>Notifications</span>
              @if (notifService.count > 0) {
                <span class="notif-badge">{{ notifService.count }}</span>
              }
            </div>
            <mat-divider></mat-divider>
            @if (notifService.loading()) {
              <div class="notif-loading" (click)="$event.stopPropagation()">
                <mat-spinner diameter="24"></mat-spinner>
              </div>
            } @else if (notifService.notifications().length === 0) {
              <div class="notif-empty" (click)="$event.stopPropagation()">
                <mat-icon>check_circle</mat-icon>
                <span>Aucune notification</span>
              </div>
            } @else {
              @for (n of notifService.notifications(); track n.id) {
                <button mat-menu-item class="notif-item" (click)="navigate(n)">
                  <mat-icon [class]="'notif-icon notif-' + n.type">{{ n.icon }}</mat-icon>
                  <div class="notif-content">
                    <span class="notif-title">{{ n.title }}</span>
                    <span class="notif-msg">{{ n.message }}</span>
                  </div>
                </button>
              }
            }
          </ng-template>
        </mat-menu>

        <!-- ── Mail / Inbox ── -->
        <button mat-icon-button class="header-btn"
          (click)="goToMessages()"
          matTooltip="Messages">
          @if (messageService.unreadCount() > 0) {
            <mat-icon [matBadge]="messageService.unreadCount()" matBadgeColor="primary" matBadgeSize="small">
              mail
            </mat-icon>
          } @else {
            <mat-icon>mail_outline</mat-icon>
          }
        </button>

        <!-- Compose button -->
        <button mat-icon-button class="header-btn" (click)="openCompose()" matTooltip="Nouveau message">
          <mat-icon>edit</mat-icon>
        </button>

        <!-- ── User menu ── -->
        <div class="user-menu">
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <span class="user-name">{{ authService.currentUser()?.username || 'User' }}</span>
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
            <button mat-menu-item (click)="openProfile()">
              <mat-icon>person</mat-icon>
              <span>Mon Profil</span>
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
export class HeaderComponent implements OnInit {
  pageTitle = input<string>('BNA Bank');

  public authService    = inject(AuthService);
  public notifService   = inject(NotificationService);
  public messageService = inject(MessageService);
  private dialog        = inject(MatDialog);
  private router        = inject(Router);

  // ── Mail state ─────────────────────────────────────────────
  ngOnInit(): void {
    this.notifService.load();
    this.messageService.loadUnreadCount();
  }

  goToMessages(): void {
    this.router.navigate(['/messages']);
  }

  openCompose(): void {
    this.dialog.open(ComposeMessageDialogComponent, {
      width: '520px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: {}
    });
  }

  navigate(n: { route: string; entityId?: number }): void {
    // For dossiers, navigate to the detail page directly
    if (n.route === '/dossiers' && n.entityId) {
      this.router.navigate(['/dossiers', n.entityId]);
    } else {
      this.router.navigate([n.route]);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  openProfile(): void {
    this.dialog.open(ProfileDialogComponent, {
      width: '520px',
      panelClass: 'profile-dialog-container',
      disableClose: false
    });
  }
}

