import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent)
  },

  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    canActivate: [authGuard],

    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard')
            .then(m => m.DashboardComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
      },

      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users')
            .then(m => m.UsersComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN'] }
      },

      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles')
            .then(m => m.RolesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN'] }
      },

      {
        path: 'prestataires',
        loadComponent: () =>
          import('./pages/prestataires/prestataires')
            .then(m => m.PrestatairesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN'] }
      },

      {
        path: 'factures',
        loadComponent: () =>
          import('./pages/factures/factures')
            .then(m => m.FacturesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN'] }
      },

      {
        path: 'dossiers',
        loadComponent: () =>
          import('./pages/dossiers/dossiers')
            .then(m => m.DossiersComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] }
      },

      {
        path: 'risques',
        loadComponent: () =>
          import('./pages/risques/risques')
            .then(m => m.RisquesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
      },

      {
        path: 'garanties',
        loadComponent: () =>
          import('./pages/garanties/garanties')
            .then(m => m.GarantiesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
      },

      {
        path: 'missions',
        loadComponent: () =>
          import('./pages/missions/missions.component')
            .then(m => m.MissionsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] }
      },

      {
        path: 'clients',
        loadComponent: () =>
          import('./pages/clients/clients')
            .then(m => m.ClientsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
      },

      {
        path: 'affaires',
        loadComponent: () =>
          import('./pages/affaires/affaires')
            .then(m => m.AffairesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
      },

      {
        path: 'audiences',
        loadComponent: () =>
          import('./pages/audiences/audiences')
            .then(m => m.AudiencesComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE', 'ROLE_CHARGEDOSSIER'] }
      },

      {
        path: 'avocats',
        loadComponent: () =>
          import('./pages/avocats/avocats')
            .then(m => m.AvocatsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_RESPONSABLE'] }
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];