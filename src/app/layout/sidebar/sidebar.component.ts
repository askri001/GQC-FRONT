import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed()">

      <div class="sidebar-header">
        <div class="logo">
          <mat-icon>account_balance</mat-icon>
          @if (!collapsed()) {
            <span class="logo-text">BNA Bank</span>
          }
        </div>
        <button class="toggle-btn" (click)="toggleCollapse()">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <nav class="sidebar-nav">
        @for (item of filteredNavItems(); track item.route) {
          <a
            [routerLink]="item.route"
            [class.active]="isActive(item.route)"
            class="nav-item"
            [matTooltip]="collapsed() ? item.label : ''"
            matTooltipPosition="right"
          >
            <mat-icon>{{ item.icon }}</mat-icon>
            @if (!collapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <div class="version">BNA Tunisia v1.0.0</div>
      </div>

    </div>
  `,
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {

  constructor(
    public authService: AuthService,
    public sidebarService: SidebarService,
    private router: Router
  ) {}

  get collapsed() { return this.sidebarService.collapsed; }

  navItems: NavItem[] = [
    { label: 'Dashboard',           icon: 'dashboard',     route: '/dashboard',    roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Utilisateurs',        icon: 'people',        route: '/users',        roles: ['ROLE_ADMIN'] },
    { label: 'Droits d\'accès',      icon: 'admin_panel_settings', route: '/roles', roles: ['ROLE_ADMIN'] },
    { label: 'Clients',             icon: 'person_add',    route: '/clients',      roles: ['ROLE_ADMIN', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Dossiers',            icon: 'folder',        route: '/dossiers',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Risques',             icon: 'warning',       route: '/risques',      roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Garanties',           icon: 'verified_user', route: '/garanties',    roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Affaires',            icon: 'gavel',         route: '/affaires',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Audiences',           icon: 'event',         route: '/audiences',    roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Prestataires',        icon: 'business',      route: '/prestataires', roles: ['ROLE_ADMIN', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Missions',            icon: 'assignment',    route: '/missions',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Factures',            icon: 'receipt',       route: '/factures',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] }
  ];

  filteredNavItems(): NavItem[] {
    const roles = this.authService.getUserRoles() || [];
    return this.navItems.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some(r => roles.includes(r));
    });
  }


  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  toggleCollapse(): void {
    this.sidebarService.toggle();
  }
}
