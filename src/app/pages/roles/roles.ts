import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RoleService, RoleDTO, PermissionDTO } from '../../core/services/role.service';
import { RoleFormDialogComponent } from './role-form-dialog';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">security</mat-icon>
            <h2>Gestion des Rôles</h2>
          </div>
          <button mat-raised-button color="primary" (click)="openCreate()">
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
                <button mat-icon-button color="primary" (click)="openEdit(role)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deleteRole(role.idRole!)"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styleUrls: ['./roles.css']
})
export class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private snackBar    = inject(MatSnackBar);
  private dialog      = inject(MatDialog);

  roles          = signal<RoleDTO[]>([]);
  allPermissions = signal<PermissionDTO[]>([]);
  loading        = signal(false);

  displayedColumns = ['name', 'description', 'permissions', 'actions'];

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles() {
    this.loading.set(true);
    this.roleService.getAll().subscribe({
      next: (data) => { this.roles.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showNotification('Erreur chargement rôles', 'error'); }
    });
  }

  loadPermissions() {
    this.roleService.getAllPermissions().subscribe({
      next: (data) => this.allPermissions.set(data),
      error: () => {}
    });
  }

  openCreate() {
    const ref = this.dialog.open(RoleFormDialogComponent, {
      width: '520px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { isEdit: false, allPermissions: this.allPermissions() }
    });
    ref.afterClosed().subscribe(result => { if (result) this.saveRole(null, result); });
  }

  openEdit(role: RoleDTO) {
    const ref = this.dialog.open(RoleFormDialogComponent, {
      width: '520px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { isEdit: true, role, allPermissions: this.allPermissions() }
    });
    ref.afterClosed().subscribe(result => { if (result) this.saveRole(role, result); });
  }

  saveRole(original: RoleDTO | null, form: any) {
    const request = original
      ? this.roleService.update(original.idRole!, form)
      : this.roleService.create(form);

    this.loading.set(true);
    request.subscribe({
      next: (saved) => {
        const roleId = saved.idRole || original?.idRole!;
        const newIds: number[] = form.permissionIds || [];
        const oldIds: number[] = original?.permissionIds || [];
        const toAdd    = newIds.filter(id => !oldIds.includes(id));
        const toRemove = oldIds.filter(id => !newIds.includes(id));
        const ops = [
          ...toAdd.map(pid => this.roleService.assignPermission(roleId, pid)),
          ...toRemove.map(pid => this.roleService.removePermission(roleId, pid))
        ];
        if (ops.length > 0) {
          forkJoin(ops).subscribe({ error: () => this.showNotification('Erreur assignation permissions', 'error') });
        }
        this.loading.set(false);
        this.loadRoles();
        this.showNotification('Rôle sauvegardé', 'success');
      },
      error: () => { this.loading.set(false); this.showNotification('Erreur sauvegarde', 'error'); }
    });
  }

  deleteRole(id: number) {
    if (!confirm('Confirmer la suppression de ce rôle ?')) return;
    this.roleService.delete(id).subscribe({
      next: () => { this.loadRoles(); this.showNotification('Rôle supprimé', 'success'); },
      error: () => this.showNotification('Erreur suppression', 'error')
    });
  }

  getPermissionCode(permissionId: number): string {
    const p = this.allPermissions().find(p => p.idPermission === permissionId);
    return p ? p.code : `#${permissionId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar' });
  }
}
