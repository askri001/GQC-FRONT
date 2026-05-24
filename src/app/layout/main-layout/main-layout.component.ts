import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarService } from '../../core/services/sidebar.service';
import { IdleService } from '../../core/services/idle.service';
import { filter } from 'rxjs';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/dossiers':     'Gestion des Dossiers',
  '/affaires':     'Gestion des Affaires',
  '/risques':      'Gestion des Risques',
  '/garanties':    'Gestion des Garanties',
  '/audiences':    'Gestion des Audiences',
  '/missions':     'Gestion des Missions',
  '/factures':     'Gestion des Factures',
  '/clients':      'Gestion des Clients',
  '/prestataires': 'Gestion des Prestataires',
  '/avocats':      'Gestion des Avocats',
  '/users':        'Gestion des Utilisateurs',
  '/roles':        'Rôles & Permissions',
  '/messages':     'Messagerie',
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout-container">
      <app-sidebar></app-sidebar>
      <div class="main-content" [class.sidebar-collapsed]="sidebarService.collapsed()">
        <app-header [pageTitle]="pageTitle()"></app-header>

        <!-- Idle warning banner -->
        @if (idleService.showWarning) {
          <div class="idle-warning">
            <span class="idle-warning-icon">⏱️</span>
            <span>Session inactive — déconnexion dans <strong>{{ idleService.secondsLeft }}s</strong></span>
            <button class="idle-stay-btn" (click)="idleService.stayLoggedIn()">Rester connecté</button>
          </div>
        }

        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  pageTitle      = signal('Dashboard');
  sidebarService = inject(SidebarService);
  idleService    = inject(IdleService);

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects.split('?')[0];
      const key = Object.keys(ROUTE_TITLES).find(k => url === k || url.startsWith(k + '/'));
      this.pageTitle.set(key ? ROUTE_TITLES[key] : 'BNA Bank');
    });
  }

  ngOnInit(): void {
    this.idleService.start();
  }

  ngOnDestroy(): void {
    this.idleService.stop();
  }
}

