import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then(m => m.UsersComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./pages/roles/roles').then(m => m.RolesComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/clients').then(m => m.ClientsComponent)
      },
      {
        path: 'dossiers',
        loadComponent: () => import('./pages/dossiers/dossiers').then(m => m.DossiersComponent)
      },
      {
        path: 'risques',
        loadComponent: () => import('./pages/risques/risques').then(m => m.RisquesComponent)
      },
      {
        path: 'garanties',
        loadComponent: () => import('./pages/garanties/garanties').then(m => m.GarantiesComponent)
      },
      {
        path: 'affaires',
        loadComponent: () => import('./pages/affaires/affaires').then(m => m.AffairesComponent)
      },
      {
        path: 'prestataires',
        loadComponent: () => import('./pages/prestataires/prestataires').then(m => m.PrestatairesComponent)
      },
      {
        path: 'missions',
        loadComponent: () => import('./pages/missions/missions').then(m => m.MissionsComponent)
      },
      {
        path: 'factures',
        loadComponent: () => import('./pages/factures/factures').then(m => m.FacturesComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

