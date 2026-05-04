import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleService, RoleDTO } from '../../core/services/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">security</mat-icon>
            <h2>Gestion des Rôles</h2>
          </div>
          <button mat-raised-button color="primary" (click)="createRole()">
            <mat-icon>add</mat-icon> Nouveau Rôle
          </button>
        </div>

        @if (loading()) {
          <div class="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des rôles...</p>
          </div>
        } @else if (roles().length === 0) {
          <div class="no-data">
            <mat-icon>security</mat-icon>
            <p>Aucun rôle trouvé</p>
          </div>
        } @else {
          <table mat-table [dataSource]="roles()" class="mat-elevation-z2 full-width">

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nom du Rôle</th>
              <td mat-cell *matCellDef="let role"><strong>{{ role.name }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let role">{{ role.description || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let role">
                <button mat-icon-button color="primary" (click)="editRole(role)" title="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteRole(role.idRole!)" title="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        }

        @if (editMode()) {
          <div class="inline-edit-row">
            <h4>{{ editId() === 0 ? 'Nouveau' : 'Modifier' }} Rôle</h4>
            <div class="edit-form">

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempRole().name" placeholder="Nom du rôle *">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempRole().description" placeholder="Description">
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveRole()"
                  [disabled]="!tempRole().name">
                  <mat-icon>save</mat-icon> {{ editId() === 0 ? 'Créer' : 'Sauvegarder' }}
                </button>
                <button mat-button color="warn" (click)="cancelEdit()">
                  <mat-icon>close</mat-icon> Annuler
                </button>
              </div>
            </div>
          </div>
        }
      </mat-card>
    </div>
  `,
  styleUrls: ['./roles.css']
})
export class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  roles = signal<RoleDTO[]>([]);
  loading = signal(false);

  editId = signal<number | null>(null);
  editMode = signal(false);
  tempRole = signal<Partial<RoleDTO>>({});

  displayedColumns = ['name', 'description', 'actions'];

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading.set(true);
    this.roleService.getAll().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading roles', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement rôles', 'error');
      }
    });
  }

  createRole() {
    this.editId.set(0);
    this.tempRole.set({ name: '', description: '' });
    this.editMode.set(true);
  }

  editRole(role: RoleDTO) {
    this.editId.set(role.idRole!);
    this.tempRole.set({ ...role });
    this.editMode.set(true);
  }

  saveRole() {
    const temp = this.tempRole();
    if (!temp.name) {
      this.showNotification('Le nom du rôle est requis', 'error');
      return;
    }

    const request = this.editId() === 0
      ? this.roleService.create(temp)
      : this.roleService.update(this.editId()!, temp);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadRoles();
        this.cancelEdit();
        this.showNotification('Rôle sauvegardé', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  deleteRole(id: number) {
    if (confirm('Confirmer la suppression de ce rôle ?')) {
      this.roleService.delete(id).subscribe({
        next: () => {
          this.loadRoles();
          this.showNotification('Rôle supprimé', 'success');
        },
        error: (err) => {
          console.error('Delete error', err);
          this.showNotification('Erreur suppression', 'error');
        }
      });
    }
  }

  cancelEdit() {
    this.editId.set(null);
    this.tempRole.set({});
    this.editMode.set(false);
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}
