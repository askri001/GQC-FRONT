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
  isSelf?: boolean; // true when the logged-in admin is editing their own account
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
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px;color:#00966E">
        {{ data.isEdit ? 'edit' : 'person_add' }}
      </mat-icon>
      {{ data.isEdit ? 'Modifier' : 'Nouvel' }} Utilisateur
    </h2>

    <mat-dialog-content>
      <div class="bna-form-grid">

        @if (!data.isEdit) {
          <mat-form-field appearance="outline" class="bna-field">
            <mat-label>Nom d'utilisateur *</mat-label>
            <mat-icon matPrefix>account_circle</mat-icon>
            <input matInput [(ngModel)]="form.username"
              (ngModelChange)="tUsername = true"
              placeholder="Ex: jdupont"
              autocomplete="username">
            @if (tUsername && !form.username.trim()) {
              <mat-error>Le nom d'utilisateur est requis</mat-error>
            } @else if (tUsername && form.username.trim().length < 3) {
              <mat-error>Minimum 3 caractères</mat-error>
            } @else if (tUsername && !isValidUsername(form.username)) {
              <mat-error>Lettres, chiffres et _ uniquement, sans espaces</mat-error>
            }
            <mat-hint>Lettres, chiffres et _ (min. 3 caractères)</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="bna-field">
          <mat-label>Prénom</mat-label>
          <mat-icon matPrefix>person_outline</mat-icon>
          <input matInput [(ngModel)]="form.prenom"
            (ngModelChange)="tPrenom = true"
            placeholder="Ex: Jean">
          @if (tPrenom && form.prenom.trim().length > 0 && form.prenom.trim().length < 2) {
            <mat-error>Minimum 2 caractères</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="bna-field">
          <mat-label>Nom</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <input matInput [(ngModel)]="form.nom"
            (ngModelChange)="tNom = true"
            placeholder="Ex: Dupont">
          @if (tNom && form.nom.trim().length > 0 && form.nom.trim().length < 2) {
            <mat-error>Minimum 2 caractères</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="bna-field" [class.bna-full]="data.isEdit">
          <mat-label>Email *</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput type="email" [(ngModel)]="form.email"
            (ngModelChange)="tEmail = true"
            placeholder="Ex: jean.dupont@bna.tn"
            autocomplete="email">
          @if (tEmail && !form.email.trim()) {
            <mat-error>L'email est requis</mat-error>
          } @else if (tEmail && !isValidEmail(form.email)) {
            <mat-error>Format d'email invalide</mat-error>
          }
        </mat-form-field>

        @if (!data.isEdit) {
          <mat-form-field appearance="outline" class="bna-field">
            <mat-label>Mot de passe *</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="form.password"
              (ngModelChange)="tPassword = true"
              autocomplete="new-password">
            <button mat-icon-button matSuffix type="button"
              (click)="showPassword = !showPassword"
              [title]="showPassword ? 'Masquer' : 'Afficher'">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (tPassword && !form.password) {
              <mat-error>Le mot de passe est requis</mat-error>
            } @else if (tPassword && form.password.length < 8) {
              <mat-error>Minimum 8 caractères</mat-error>
            } @else if (tPassword && !/[0-9]/.test(form.password)) {
              <mat-error>Doit contenir au moins un chiffre</mat-error>
            } @else if (tPassword && !/[A-Z]/.test(form.password)) {
              <mat-error>Doit contenir au moins une majuscule</mat-error>
            }
            <mat-hint>Min. 8 caractères, 1 chiffre, 1 majuscule</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="bna-field bna-full">
          <mat-label>Rôle *</mat-label>
          <mat-icon matPrefix>security</mat-icon>
          <mat-select [(ngModel)]="form.roleId"
            (ngModelChange)="tRoleIds = true"
            [disabled]="!!data.isSelf">
            @for (role of data.availableRoles; track role.idRole) {
              <mat-option [value]="role.idRole">{{ role.name }}</mat-option>
            }
          </mat-select>
          @if (data.isSelf) {
            <mat-hint style="color:#e65100">Vous ne pouvez pas modifier votre propre rôle</mat-hint>
          }
          @if (tRoleIds && !form.roleId) {
            <mat-error>Veuillez assigner un rôle</mat-error>
          }
        </mat-form-field>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSubmit()">
        <mat-icon>{{ data.isEdit ? 'save' : 'person_add' }}</mat-icon>
        {{ data.isEdit ? 'Modifier' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `
})
export class UserFormDialogComponent {
  data      = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  snackBar  = inject(MatSnackBar);

  showPassword = false;

  // Track which fields the user has interacted with
  tUsername = false;
  tPrenom   = false;
  tNom      = false;
  tEmail    = false;
  tPassword = false;
  tRoleIds  = false;

  form = {
    username: this.data.user?.username ?? '',
    prenom:   this.data.user?.prenom   ?? '',
    nom:      this.data.user?.nom      ?? '',
    email:    this.data.user?.email    ?? '',
    password: '',
    roleId:   this.data.currentRoleIds[0] ?? null as number | null
  };

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,}$/.test(username.trim());
  }

  isValidPassword(password: string): boolean {
    return password.length >= 8 &&
           /[0-9]/.test(password) &&
           /[A-Z]/.test(password);
  }

  onSubmit(): void {
    // Touch all fields to show all errors at once
    this.tUsername = true;
    this.tEmail    = true;
    this.tPassword = true;
    this.tRoleIds  = true;
    this.tPrenom   = true;
    this.tNom      = true;

    // Email
    if (!this.form.email.trim()) {
      this.snackBar.open('L\'email est requis', 'OK', { duration: 3000 });
      return;
    }
    if (!this.isValidEmail(this.form.email)) {
      this.snackBar.open('Format d\'email invalide', 'OK', { duration: 3000 });
      return;
    }

    if (!this.data.isEdit) {
      // Username
      if (!this.form.username.trim()) {
        this.snackBar.open('Le nom d\'utilisateur est requis', 'OK', { duration: 3000 });
        return;
      }
      if (!this.isValidUsername(this.form.username)) {
        this.snackBar.open('Nom d\'utilisateur invalide (lettres, chiffres et _ uniquement, min. 3 caractères)', 'OK', { duration: 4000 });
        return;
      }
      // Password
      if (!this.form.password) {
        this.snackBar.open('Le mot de passe est requis', 'OK', { duration: 3000 });
        return;
      }
      if (!this.isValidPassword(this.form.password)) {
        this.snackBar.open('Le mot de passe doit contenir au moins 8 caractères, 1 chiffre et 1 majuscule', 'OK', { duration: 4000 });
        return;
      }
    }

    // Role — skip check if editing self (role is locked)
    if (!this.data.isSelf && !this.form.roleId) {
      this.snackBar.open('Veuillez assigner un rôle', 'OK', { duration: 3000 });
      return;
    }

    this.dialogRef.close(this.form);
  }
}
