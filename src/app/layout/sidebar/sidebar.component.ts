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
            <span class="logo-text">BNA Bank</span>
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
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems: NavItem[] = [
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
  ];

  toggleCollapse() {
    this.collapsed.update(v => !v);
  }
}

