import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Role, Permission } from '../../core/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <h2>Gestion des Rôles & Permissions</h2>
          <button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouveau Rôle</button>
        </div>
        <table mat-table [dataSource]="roles()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom du Rôle</th>
            <td mat-cell *matCellDef="let role"><strong>{{ role.name }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let role">{{ role.description }}</td>
          </ng-container>
          <ng-container matColumnDef="permissions">
            <th mat-header-cell *matHeaderCellDef>Permissions</th>
            <td mat-cell *matCellDef="let role">
              @for (perm of role.permissions.slice(0,3); track perm.id) {
                <mat-chip>{{ perm.name }}</mat-chip>
              }
              @if (role.permissions.length > 3) {
                <mat-chip>+{{ role.permissions.length - 3 }}</mat-chip>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let role">
              <button mat-icon-button color="primary"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.full-width { width: 100%; }`]
})
export class RolesComponent implements OnInit {
  roles = signal<Role[]>([]);
  displayedColumns = ['name', 'description', 'permissions', 'actions'];
  ngOnInit() {
    this.roles.set([
      { id: 1, name: 'ADMINISTRATEUR', description: 'Administrateur système', permissions: [{ id: 1, name: 'Gestion Utilisateurs', code: 'USER_ALL', module: 'users' }], active: true },
      { id: 2, name: 'CHARGE_DOSSIER', description: 'Chargé de dossier contentieux', permissions: [{ id: 2, name: 'Gestion Dossiers', code: 'DOSSIER_CRUD', module: 'dossiers' }], active: true },
      { id: 3, name: 'RESPONSABLE_CONTENTIEUX', description: 'Responsable du contentieux', permissions: [{ id: 3, name: 'Supervision', code: 'SUPER_ALL', module: 'admin' }], active: true }
    ]);
  }
}

