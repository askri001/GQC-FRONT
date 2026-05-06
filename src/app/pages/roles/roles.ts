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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleService, RoleDTO, PermissionDTO } from '../../core/services/role.service';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DrawerPanelComponent
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
          <div class="loading"><mat-spinner diameter="50"></mat-spinner><p>Chargement des rôles...</p></div>
        } @else if (roles().length === 0) {
          <div class="no-data"><mat-icon>security</mat-icon><p>Aucun rôle trouvé</p></div>
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
            <ng-container matColumnDef="permissions">
              <th mat-header-cell *matHeaderCellDef>Permissions</th>
              <td mat-cell *matCellDef="let role">
                @if (role.permissionIds?.length) {
                  @for (pid of role.permissionIds; track pid) {
                    <mat-chip>{{ getPermissionCode(pid) }}</mat-chip>
                  }
                } @else {
                  <span style="color:#999">Aucune</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let role">
                <button mat-icon-button color="primary" (click)="editRole(role)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deleteRole(role.idRole!)"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        }
      </mat-card>
    </div>

    <!-- Drawer -->
    <app-drawer-panel
      [open]="editMode()"
      [title]="editId() === 0 ? 'Nouveau Rôle' : 'Modifier Rôle'"
      icon="security"
      [saveLabel]="editId() === 0 ? 'Créer' : 'Sauvegarder'"
      [saveDisabled]="!tempRole().name"
      [saving]="loading()"
      (closed)="cancelEdit()"
      (saved)="saveRole()">

      <mat-form-field appearance="outline">
        <mat-label>Nom du rôle *</mat-label>
        <input matInput [(ngModel)]="tempRole().name">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="tempRole().description" rows="3"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Permissions</mat-label>
        <mat-select [(ngModel)]="tempRole().permissionIds" multiple>
          @for (p of allPermissions(); track p.idPermission) {
            <mat-option [value]="p.idPermission">{{ p.code }} — {{ p.description || '' }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </app-drawer-panel>
  `,
  styleUrls: ['./roles.css']
})
export class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  roles = signal<RoleDTO[]>([]);
  allPermissions = signal<PermissionDTO[]>([]);
  loading = signal(false);

  editId = signal<number | null>(null);
  editMode = signal(false);
  tempRole = signal<Partial<RoleDTO>>({});
  originalPermissionIds = signal<number[]>([]);

  displayedColumns = ['name', 'description', 'permissions', 'actions'];

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles() {
    this.loading.set(true);
    this.roleService.getAll().subscribe({
      next: (data) => { this.roles.set(data); this.loading.set(false); },
      error: (err) => { console.error(err); this.loading.set(false); this.showNotification('Erreur chargement rôles', 'error'); }
    });
  }

  loadPermissions() {
    this.roleService.getAllPermissions().subscribe({
      next: (data) => this.allPermissions.set(data),
      error: (err) => console.error('Error loading permissions', err)
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
    this.originalPermissionIds.set([...(role.permissionIds || [])]);
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
      next: (saved) => {
        const roleId = saved.idRole || this.editId()!;
        const newIds = temp.permissionIds || [];
        const oldIds = this.originalPermissionIds();

        const toAdd = newIds.filter(id => !oldIds.includes(id));
        const toRemove = oldIds.filter(id => !newIds.includes(id));

        const ops = [
          ...toAdd.map(pid => this.roleService.assignPermission(roleId, pid)),
          ...toRemove.map(pid => this.roleService.removePermission(roleId, pid))
        ];

        if (ops.length > 0) {
          ops.forEach(op => op.subscribe());
        }

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
    this.originalPermissionIds.set([]);
    this.editMode.set(false);
  }

  getPermissionCode(permissionId: number): string {
    const p = this.allPermissions().find(p => p.idPermission === permissionId);
    return p ? p.code : `#${permissionId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}
