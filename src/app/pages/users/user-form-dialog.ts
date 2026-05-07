import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleDTO } from '../../core/services/role.service';

export interface UserFormDialogData {
  isEdit: boolean;
  user?: any;
  availableRoles: RoleDTO[];
  currentRoleIds: number[];
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Modifier' : 'Nouvel' }} Utilisateur</h2>

    <mat-dialog-content>
      <div class="bna-form-grid">

        @if (!data.isEdit) {
          <mat-form-field appearance="outline" class="bna-field">
            <mat-label>Nom d'utilisateur *</mat-label>
            <mat-icon matPrefix>account_circle</mat-icon>
            <input matInput [(ngModel)]="form.username" placeholder="Ex: jdupont">
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="bna-field">
          <mat-label>Prénom</mat-label>
          <mat-icon matPrefix>person_outline</mat-icon>
          <input matInput [(ngModel)]="form.prenom">
        </mat-form-field>

        <mat-form-field appearance="outline" class="bna-field">
          <mat-label>Nom</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput [(ngModel)]="form.nom">
        </mat-form-field>

        <mat-form-field appearance="outline" class="bna-field" [class.bna-full]="data.isEdit">
          <mat-label>Email *</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput type="email" [(ngModel)]="form.email">
        </mat-form-field>

        @if (!data.isEdit) {
          <mat-form-field appearance="outline" class="bna-field">
            <mat-label>Mot de passe *</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput type="password" [(ngModel)]="form.password">
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="bna-field bna-full">
          <mat-label>Rôles</mat-label>
          <mat-icon matPrefix>security</mat-icon>
          <mat-select [(ngModel)]="form.roleIds" multiple>
            @for (role of data.availableRoles; track role.idRole) {
              <mat-option [value]="role.idRole">{{ role.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSubmit()"
        [disabled]="data.isEdit ? !form.email : !form.username || !form.email || !form.password">
        {{ data.isEdit ? 'Modifier' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `
})
export class UserFormDialogComponent {
  data      = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  snackBar  = inject(MatSnackBar);

  form = {
    username: this.data.user?.username ?? '',
    prenom:   this.data.user?.prenom   ?? '',
    nom:      this.data.user?.nom      ?? '',
    email:    this.data.user?.email    ?? '',
    password: '',
    roleIds:  [...this.data.currentRoleIds]
  };

  onSubmit(): void {
    if (!this.form.email?.trim()) {
      this.snackBar.open('L\'email est requis', 'OK', { duration: 3000 });
      return;
    }
    if (!this.data.isEdit && !this.form.password?.trim()) {
      this.snackBar.open('Le mot de passe est requis', 'OK', { duration: 3000 });
      return;
    }
    this.dialogRef.close(this.form);
  }
}
