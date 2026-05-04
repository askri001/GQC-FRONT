import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
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
<<<<<<< Updated upstream
  styleUrls: ['./sidebar.css']
=======
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: linear-gradient(180deg, #2e7d32 0%, #388e3c 100%);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
    }

    .logo mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 24px;
      font-weight: bold;
    }

    .toggle-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
    }

    .sidebar-nav {
      flex: 1;
      padding: 15px 10px;
    }

    .nav-item {
  display: flex;
  gap: 12px;
  padding: 12px 15px;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255,255,255,0.15);
  color: white;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(90deg, #43a047, #66bb6a);
  color: white;
  box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
  transform: translateX(4px);
}

.nav-item.active mat-icon {
  transform: scale(1.1);
}

    .sidebar-footer {
      padding: 15px;
      text-align: center;
      color: rgba(255,255,255,0.5);
      font-size: 12px;
    }
  `]
>>>>>>> Stashed changes
})
export class SidebarComponent {

constructor(
  public authService: AuthService,
  private router: Router
) {}  

  collapsed = signal(false);

  navItems: NavItem[] = [
<<<<<<< Updated upstream
    { label: 'Accueil', icon: 'dashboard', route: '/dashboard' },
    { label: 'Utilisateurs', icon: 'people', route: '/users', roles: ['ADMINISTRATEUR'] },
    { label: 'Rôles & Permissions', icon: 'security', route: '/roles', roles: ['ADMINISTRATEUR'] },
    { label: 'Clients', icon: 'person_add', route: '/clients' },
    { label: 'Dossiers', icon: 'folder', route: '/dossiers' },
    { label: 'Risques', icon: 'warning', route: '/risques' },
    { label: 'Garanties', icon: 'verified_user', route: '/garanties' },
    { label: 'Affaires', icon: 'gavel', route: '/affaires' },
    { label: 'Prestataires', icon: 'business', route: '/prestataires' },
    { label: 'Avocats', icon: 'gavel', route: '/avocats' },
    { label: 'Missions', icon: 'assignment', route: '/missions' },
    { label: 'Factures', icon: 'receipt', route: '/factures' }
=======
    { label: 'Dashboard',           icon: 'dashboard',     route: '/dashboard',    roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] },
    { label: 'Utilisateurs',        icon: 'people',        route: '/users',        roles: ['ROLE_ADMIN'] },
    { label: 'Rôles & Permissions', icon: 'security',      route: '/roles',        roles: ['ROLE_ADMIN'] },
    { label: 'Clients',             icon: 'person_add',    route: '/clients',      roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] },
    { label: 'Dossiers',            icon: 'folder',        route: '/dossiers',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Risques',             icon: 'warning',       route: '/risques',      roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] },
    { label: 'Garanties',           icon: 'verified_user', route: '/garanties',    roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] },
    { label: 'Affaires',            icon: 'gavel',         route: '/affaires',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] },
    { label: 'Audiences',           icon: 'event',         route: '/audiences',    roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Prestataires',        icon: 'business',      route: '/prestataires', roles: ['ROLE_ADMIN'] },
    { label: 'Avocats',             icon: 'gavel',         route: '/avocats',      roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] },
    { label: 'Missions',            icon: 'assignment',    route: '/missions',     roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] },
    { label: 'Factures',            icon: 'receipt',       route: '/factures',     roles: ['ROLE_ADMIN'] }
>>>>>>> Stashed changes
  ];

  filteredNavItems() {
    const roles = this.authService.getUserRoles() || [];

    return this.navItems.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.some(r => roles.includes(r));
    });
    
  }
  isActive(route: string): boolean {
  return this.router.url.startsWith(route);
}

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }
}