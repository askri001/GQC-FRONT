import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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
            <span class="logo-text">BNA</span>
          }
        </div>
        <button class="toggle-btn" (click)="toggleCollapse()">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <nav class="sidebar-nav">
        @for (item of navItems; track item.route) {
          <a 
            [routerLink]="item.route" 
            routerLinkActive="active"
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
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }

    .logo mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .logo-text {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
    }

    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .sidebar-nav {
      flex: 1;
      padding: 15px 10px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 15px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      border-radius: 8px;
      margin-bottom: 5px;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .nav-item.active {
      background: linear-gradient(90deg, #43a047 0%, #66bb6a 100%);
      color: #fff;
      box-shadow: 0 4px 15px rgba(67, 160, 71, 0.4);
    }

    .nav-item mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .nav-label {
      font-size: 14px;
      font-weight: 500;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 12px;
    }

    .sidebar-footer {
      padding: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .version {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      text-align: center;
    }
  `]
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
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
  ];

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }
}

