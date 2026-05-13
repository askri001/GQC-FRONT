import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleDTO, PermissionDTO } from '../../core/services/role.service';

export interface RoleFormDialogData {
  isEdit: boolean;
  role?: RoleDTO;
  allPermissions: PermissionDTO[];
}

@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Modifier' : 'Nouveau' }} Rôle</h2>

    <mat-dialog-content>
      <div class="bna-form-grid">

        <mat-form-field appearance="outline" class="bna-field bna-full">
          <mat-label>Nom du rôle *</mat-label>
          <mat-icon matPrefix>security</mat-icon>
          <input matInput [(ngModel)]="form.name" placeholder="Ex: SUPERVISEUR">
        </mat-form-field>

        <mat-form-field appearance="outline" class="bna-field bna-full">
          <mat-label>Description</mat-label>
          <mat-icon matPrefix>description</mat-icon>
          <textarea matInput [(ngModel)]="form.description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="bna-field bna-full">
          <mat-label>Permissions</mat-label>
          <mat-icon matPrefix>lock_open</mat-icon>
          <mat-select [(ngModel)]="form.permissionIds" multiple>
            @for (p of data.allPermissions; track p.idPermission) {
              <mat-option [value]="p.idPermission">{{ p.code }}{{ p.description ? ' — ' + p.description : '' }}</mat-option>
            }
            @if (data.allPermissions.length === 0) {
              <mat-option disabled>Aucune permission disponible</mat-option>
            }
          </mat-select>
        </mat-form-field>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!form.name.trim()">
        {{ data.isEdit ? 'Modifier' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `
})
export class RoleFormDialogComponent {
  data = inject<RoleFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  snackBar = inject(MatSnackBar);

  form = {
    name: this.data.role?.name ?? '',
    description: this.data.role?.description ?? '',
    permissionIds: [...(this.data.role?.permissionIds ?? [])]
  };

  onSubmit(): void {
    if (!this.form.name.trim()) {
      this.snackBar.open('Le nom du rôle est requis', 'OK', { duration: 3000 });
      return;
    }
    this.dialogRef.close(this.form);
  }
}
