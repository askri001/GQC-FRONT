import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { User } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatPaginatorModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <h2>Gestion des Utilisateurs</h2>
          <button mat-raised-button color="primary">
            <mat-icon>add</mat-icon> Nouvel Utilisateur
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Rechercher</mat-label>
            <input matInput placeholder="Nom, email...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <table mat-table [dataSource]="users()" class="full-width">
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Nom d'utilisateur</th>
            <td mat-cell *matCellDef="let user">{{ user.username }}</td>
          </ng-container>

          <ng-container matColumnDef="fullName">
            <th mat-header-cell *matHeaderCellDef>Nom Complet</th>
            <td mat-cell *matCellDef="let user">{{ user.firstName }} {{ user.lastName }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <ng-container matColumnDef="roles">
            <th mat-header-cell *matHeaderCellDef>Rôles</th>
            <td mat-cell *matCellDef="let user">
              @for (role of user.roles; track role.id) {
                <mat-chip>{{ role.name }}</mat-chip>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [class]="user.active ? 'active-chip' : 'inactive-chip'">
                {{ user.active ? 'Actif' : 'Inactif' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button color="primary"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 0; }
    .page-card { padding: 20px; border-radius: 12px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card-header h2 { margin: 0; color: #1a237e; }
    .filters { margin-bottom: 20px; }
    .filters mat-form-field { width: 300px; }
    .full-width { width: 100%; }
    .active-chip { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .inactive-chip { background: #ffebee !important; color: #c62828 !important; }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  displayedColumns = ['username', 'fullName', 'email', 'roles', 'active', 'actions'];

  ngOnInit() {
    // Mock data
    this.users.set([
      { id: 1, username: 'admin', email: 'admin@gac.ma', firstName: 'Admin', lastName: 'System', active: true, roles: [{ id: 1, name: 'ADMINISTRATEUR', permissions: [], active: true }] },
      { id: 2, username: 'charge1', email: 'charge1@gac.ma', firstName: 'Ahmed', lastName: 'Bennani', active: true, roles: [{ id: 2, name: 'CHARGE_DOSSIER', permissions: [], active: true }] },
      { id: 3, username: 'responsable', email: 'resp@gac.ma', firstName: 'Fatima', lastName: 'Alami', active: true, roles: [{ id: 3, name: 'RESPONSABLE_CONTENTIEUX', permissions: [], active: true }] }
    ]);
  }
}

