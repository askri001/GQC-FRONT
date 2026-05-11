import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

interface PermissionRow {
  module: string;
  action: string;
  charge: boolean;
  responsable: boolean;
  admin: boolean;
  isHeader?: boolean;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">

        <!-- ── Header ─────────────────────────────────────── -->
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">admin_panel_settings</mat-icon>
            <div>
              <h2>Droits d'accès</h2>
              <p class="subtitle">Matrice des permissions par rôle</p>
            </div>
          </div>
        </div>

        <!-- ── Role legend ────────────────────────────────── -->
        <div class="role-legend">
          <div class="role-badge charge">
            <mat-icon>work</mat-icon>
            <span>Chargé de Dossier</span>
          </div>
          <div class="role-badge responsable">
            <mat-icon>supervisor_account</mat-icon>
            <span>Responsable</span>
          </div>
          <div class="role-badge admin">
            <mat-icon>manage_accounts</mat-icon>
            <span>Administrateur</span>
          </div>
        </div>

        <!-- ── Matrix table ───────────────────────────────── -->
        <div class="matrix-wrapper">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="col-module">Module</th>
                <th class="col-action">Action</th>
                <th class="col-role charge-col">
                  <mat-icon>work</mat-icon>
                  <span>Chargé</span>
                </th>
                <th class="col-role responsable-col">
                  <mat-icon>supervisor_account</mat-icon>
                  <span>Responsable</span>
                </th>
                <th class="col-role admin-col">
                  <mat-icon>manage_accounts</mat-icon>
                  <span>Admin</span>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows; track $index) {
                @if (row.isHeader) {
                  <tr class="module-header-row">
                    <td colspan="5" class="module-header-cell">
                      <mat-icon>{{ getModuleIcon(row.module) }}</mat-icon>
                      {{ row.module }}
                    </td>
                  </tr>
                } @else {
                  <tr class="data-row">
                    <td class="td-module"></td>
                    <td class="td-action">{{ row.action }}</td>
                    <td class="td-chip">
                      <span [class]="row.charge ? 'chip-yes' : 'chip-no'">
                        <mat-icon>{{ row.charge ? 'check' : 'close' }}</mat-icon>
                        {{ row.charge ? 'Autorisé' : 'Refusé' }}
                      </span>
                    </td>
                    <td class="td-chip">
                      <span [class]="row.responsable ? 'chip-yes' : 'chip-no'">
                        <mat-icon>{{ row.responsable ? 'check' : 'close' }}</mat-icon>
                        {{ row.responsable ? 'Autorisé' : 'Refusé' }}
                      </span>
                    </td>
                    <td class="td-chip">
                      <span [class]="row.admin ? 'chip-yes' : 'chip-no'">
                        <mat-icon>{{ row.admin ? 'check' : 'close' }}</mat-icon>
                        {{ row.admin ? 'Autorisé' : 'Refusé' }}
                      </span>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- ── Footer note ────────────────────────────────── -->
        <div class="footer-note">
          <mat-icon>info_outline</mat-icon>
          Ces droits sont définis par le système et ne peuvent pas être modifiés.
        </div>

      </mat-card>
    </div>
  `,
  styleUrls: ['./roles.css']
})
export class RolesComponent {

  rows: PermissionRow[] = [
    // ── DOSSIERS ──────────────────────────────────────────
    { module: 'Dossiers Contentieux', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Dossiers', action: 'Consulter',                    charge: true,  responsable: true,  admin: true  },
    { module: 'Dossiers', action: 'Créer / Modifier',             charge: true,  responsable: false, admin: false },
    { module: 'Dossiers', action: 'Soumettre pour validation',    charge: true,  responsable: false, admin: false },
    { module: 'Dossiers', action: 'Valider / Rejeter',            charge: false, responsable: true,  admin: false },
    { module: 'Dossiers', action: 'Supprimer',                    charge: true,  responsable: false, admin: false },
    { module: 'Dossiers', action: 'Exporter PDF',                 charge: true,  responsable: true,  admin: true  },

    // ── CLIENTS ───────────────────────────────────────────
    { module: 'Clients', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Clients', action: 'Consulter',            charge: true,  responsable: true,  admin: true  },
    { module: 'Clients', action: 'Créer / Modifier',     charge: true,  responsable: false, admin: false },
    { module: 'Clients', action: 'Activer / Désactiver', charge: true,  responsable: false, admin: false },
    { module: 'Clients', action: 'Supprimer',            charge: true,  responsable: false, admin: false },

    // ── AFFAIRES ──────────────────────────────────────────
    { module: 'Affaires', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Affaires', action: 'Consulter',                 charge: true,  responsable: true,  admin: true  },
    { module: 'Affaires', action: 'Créer / Modifier',          charge: true,  responsable: false, admin: false },
    { module: 'Affaires', action: 'Soumettre pour validation', charge: true,  responsable: false, admin: false },
    { module: 'Affaires', action: 'Valider / Rejeter',         charge: false, responsable: true,  admin: false },
    { module: 'Affaires', action: 'Supprimer',                 charge: true,  responsable: false, admin: false },

    // ── AUDIENCES ─────────────────────────────────────────
    { module: 'Audiences', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Audiences', action: 'Consulter',        charge: true,  responsable: true,  admin: true  },
    { module: 'Audiences', action: 'Créer / Modifier', charge: true,  responsable: false, admin: false },
    { module: 'Audiences', action: 'Supprimer',        charge: true,  responsable: false, admin: false },

    // ── RISQUES ───────────────────────────────────────────
    { module: 'Risques', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Risques', action: 'Consulter',        charge: true,  responsable: true,  admin: true  },
    { module: 'Risques', action: 'Créer / Modifier', charge: true,  responsable: false, admin: false },
    { module: 'Risques', action: 'Supprimer',        charge: true,  responsable: false, admin: false },

    // ── GARANTIES ─────────────────────────────────────────
    { module: 'Garanties', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Garanties', action: 'Consulter',        charge: true,  responsable: true,  admin: true  },
    { module: 'Garanties', action: 'Créer / Modifier', charge: true,  responsable: false, admin: false },
    { module: 'Garanties', action: 'Supprimer',        charge: true,  responsable: false, admin: false },

    // ── MISSIONS ──────────────────────────────────────────
    { module: 'Missions', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Missions', action: 'Consulter',                 charge: true,  responsable: true,  admin: true  },
    { module: 'Missions', action: 'Créer / Modifier',          charge: true,  responsable: false, admin: false },
    { module: 'Missions', action: 'Soumettre pour validation', charge: true,  responsable: false, admin: false },
    { module: 'Missions', action: 'Valider / Rejeter',         charge: false, responsable: true,  admin: false },
    { module: 'Missions', action: 'Annuler / Supprimer',       charge: true,  responsable: false, admin: false },

    // ── FACTURES ──────────────────────────────────────────
    { module: 'Factures', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Factures', action: 'Consulter',                 charge: true,  responsable: true,  admin: true  },
    { module: 'Factures', action: 'Créer',                     charge: true,  responsable: false, admin: false },
    { module: 'Factures', action: 'Soumettre pour validation', charge: true,  responsable: false, admin: false },
    { module: 'Factures', action: 'Valider / Rejeter',         charge: false, responsable: true,  admin: false },
    { module: 'Factures', action: 'Supprimer',                 charge: true,  responsable: false, admin: false },

    // ── PRESTATAIRES ──────────────────────────────────────
    { module: 'Prestataires', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Prestataires', action: 'Consulter',            charge: true,  responsable: true,  admin: true  },
    { module: 'Prestataires', action: 'Créer / Modifier',     charge: true,  responsable: false, admin: false },
    { module: 'Prestataires', action: 'Activer / Désactiver', charge: true,  responsable: false, admin: false },
    { module: 'Prestataires', action: 'Supprimer',            charge: true,  responsable: false, admin: false },

    // ── TABLEAU DE BORD ───────────────────────────────────
    { module: 'Tableau de Bord', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Tableau de Bord', action: 'Accéder / Statistiques', charge: true, responsable: true, admin: true },

    // ── ADMINISTRATION ────────────────────────────────────
    { module: 'Administration', action: '', charge: false, responsable: false, admin: false, isHeader: true },
    { module: 'Administration', action: 'Gérer les utilisateurs', charge: false, responsable: false, admin: true },
    { module: 'Administration', action: 'Consulter les droits',   charge: false, responsable: false, admin: true },
  ];

  getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      'Dossiers Contentieux': 'folder',
      'Clients':              'people',
      'Affaires':             'gavel',
      'Audiences':            'event',
      'Risques':              'warning',
      'Garanties':            'verified_user',
      'Missions':             'assignment',
      'Factures':             'receipt',
      'Prestataires':         'business',
      'Tableau de Bord':      'dashboard',
      'Administration':       'manage_accounts',
    };
    return icons[module] ?? 'circle';
  }
}
