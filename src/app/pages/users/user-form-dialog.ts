import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleDTO } from '../../core/services/role.service';

export interface UserFormDialogData {
  isEdit: boolean;
  user?: any;
  availableRoles: RoleDTO[];
  currentRoleIds: number[];
  isSelf?: boolean;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatIconModule, MatSnackBarModule
  ],
  templateUrl: './user-form-dialog.html',
  styleUrls: ['./user-form-dialog.css']
})
export class UserFormDialogComponent {
  data      = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  snackBar  = inject(MatSnackBar);

  showPassword = false;
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

  get dialogTitle(): string {
    return this.data.isEdit ? 'Modifier utilisateur' : 'Nouvel utilisateur';
  }

  get dialogSubtitle(): string {
    return this.data.isEdit
      ? 'Modifiez les informations ci-dessous'
      : 'Remplissez les informations pour créer un compte';
  }

  get saveLabel(): string {
    return this.data.isEdit ? 'Sauvegarder' : 'Créer';
  }

  get saveIcon(): string {
    return this.data.isEdit ? 'save' : 'person_add';
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{3,}$/.test(username.trim());
  }

  isValidPassword(password: string): boolean {
    return password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password);
  }

  getRoleLabel(name: string): string {
    const map: Record<string, string> = {
      'ADMIN': 'Administrateur',
      'RESPONSABLE': 'Responsable',
      'CHARGEDOSSIER': 'Chargé de Dossier'
    };
    return map[name] || name;
  }

  onSubmit(): void {
    this.tUsername = true;
    this.tEmail    = true;
    this.tPassword = true;
    this.tRoleIds  = true;

    if (!this.form.email.trim() || !this.isValidEmail(this.form.email)) {
      this.snackBar.open('Email invalide', 'OK', { duration: 3000 });
      return;
    }

    if (!this.data.isEdit) {
      if (!this.form.username.trim() || !this.isValidUsername(this.form.username)) {
        this.snackBar.open('Nom utilisateur invalide (lettres, chiffres, _ min. 3 car.)', 'OK', { duration: 4000 });
        return;
      }
      if (!this.form.password || !this.isValidPassword(this.form.password)) {
        this.snackBar.open('Mot de passe : min. 8 car., 1 chiffre, 1 majuscule', 'OK', { duration: 4000 });
        return;
      }
    }

    if (!this.data.isSelf && !this.form.roleId) {
      this.snackBar.open('Veuillez assigner un rôle', 'OK', { duration: 3000 });
      return;
    }

    this.dialogRef.close(this.form);
  }
}
