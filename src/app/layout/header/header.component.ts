import { Component, input, inject, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
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
import { WebSocketService } from '../../core/services/websocket.service';
import { ProfileDialogComponent } from '../../shared/profile-dialog/profile-dialog.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
        <div class="notif-wrapper">
          <button class="header-btn icon-btn-round"
            (click)="toggleNotif()"
            [class.active]="notifOpen">
            @if (notifService.count > 0) {
              <span class="icon-badge">{{ notifService.count }}</span>
            }
            <mat-icon>{{ notifService.count > 0 ? 'notifications' : 'notifications_none' }}</mat-icon>
          </button>

          @if (notifOpen) {
            <div class="notif-panel">
              <div class="notif-panel-header">
                <div class="notif-panel-title">
                  <mat-icon>notifications</mat-icon>
                  <span>Notifications</span>
                </div>
                @if (notifService.count > 0) {
                  <span class="notif-count-badge">{{ notifService.count }}</span>
                }
              </div>

              <div class="notif-panel-body">
                @if (notifService.loading()) {
                  <div class="notif-panel-state">
                    <mat-spinner diameter="28"></mat-spinner>
                  </div>
                } @else if (notifService.notifications().length === 0) {
                  <div class="notif-panel-state">
                    <mat-icon>check_circle_outline</mat-icon>
                    <span>Tout est à jour</span>
                    <small>Aucune action requise</small>
                  </div>
                } @else {
                  @for (n of notifService.notifications(); track n.id) {
                    <div class="notif-row" (click)="navigateAndClose(n)">
                      <div class="notif-row-icon" [class]="'notif-bg-' + n.type">
                        <mat-icon [class]="'notif-color-' + n.type">{{ n.icon }}</mat-icon>
                      </div>
                      <div class="notif-row-content">
                        <span class="notif-row-title">{{ n.title }}</span>
                        <span class="notif-row-sub">{{ n.message }}</span>
                      </div>
                      <mat-icon class="notif-row-arrow">chevron_right</mat-icon>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>

        <!-- ── Mail ── -->
        <button class="header-btn icon-btn-round" (click)="goToMessages()">
          @if (messageService.unreadCount() > 0) {
            <span class="icon-badge">{{ messageService.unreadCount() }}</span>
          }
          <mat-icon>{{ messageService.unreadCount() > 0 ? 'mail' : 'mail_outline' }}</mat-icon>
        </button>

        <!-- ── User menu ── -->
        <div class="user-menu">
          <button class="user-btn" [matMenuTriggerFor]="userMenu">
            <div class="user-initials-avatar">{{ getInitials() }}</div>
            <div class="user-btn-info">
              <span class="user-btn-name">{{ getFullName() }}</span>
              <span class="user-btn-role">{{ getPrimaryRole() }}</span>
            </div>
            <mat-icon class="user-btn-arrow">keyboard_arrow_down</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" class="user-dropdown-menu">
            <!-- Profile header inside dropdown -->
            <div class="user-dropdown-header" (click)="$event.stopPropagation()">
              <div class="user-dropdown-avatar">{{ getInitials() }}</div>
              <div class="user-dropdown-info">
                <span class="user-dropdown-name">{{ getFullName() }}</span>
                <span class="user-dropdown-email">{{ authService.currentUser()?.email }}</span>
                <span class="user-dropdown-role-badge">{{ getPrimaryRole() }}</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="openProfile()">
              <mat-icon>manage_accounts</mat-icon>
              <span>Mon Profil</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item class="logout-item" (click)="logout()">
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
export class HeaderComponent implements OnInit, OnDestroy {
  pageTitle = input<string>('BNA Bank');

  public authService    = inject(AuthService);
  public notifService   = inject(NotificationService);
  public messageService = inject(MessageService);
  private wsService     = inject(WebSocketService);
  private dialog        = inject(MatDialog);
  private router        = inject(Router);

  notifOpen = false;
  private subs: Subscription[] = [];

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.notif-wrapper')) {
      this.notifOpen = false;
    }
  }

  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) this.notifService.load();
  }

  navigateAndClose(n: { route: string; entityId?: number }): void {
    this.notifOpen = false;
    this.navigate(n);
  }

  ngOnInit(): void {
    this.notifService.load();
    this.messageService.loadUnreadCount();

    // Real-time: new message → update unread count
    this.subs.push(
      this.wsService.newMessage$.subscribe(() => {
        this.messageService.loadUnreadCount();
      })
    );

    // Real-time: notification refresh (validation status changed)
    this.subs.push(
      this.wsService.notifRefresh$.subscribe(() => {
        this.notifService.load();
        this.messageService.loadUnreadCount();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  goToMessages(): void {
    this.notifOpen = false;
    this.router.navigate(['/messages']);
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

  getInitials(): string {
    const u = this.authService.currentUser();
    const first = u?.firstName || '';
    const last  = u?.lastName  || '';
    if (first || last) {
      return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
    }
    return (u?.username || 'U')[0].toUpperCase();
  }

  getFullName(): string {
    const u = this.authService.currentUser();
    const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
    return name || u?.username || 'Utilisateur';
  }

  getPrimaryRole(): string {
    const roles = this.authService.getUserRoles();
    if (roles.includes('ROLE_ADMIN'))         return 'Administrateur';
    if (roles.includes('ROLE_RESPONSABLE'))   return 'Responsable';
    if (roles.includes('ROLE_CHARGEDOSSIER')) return 'Chargé de Dossier';
    return '';
  }
}

