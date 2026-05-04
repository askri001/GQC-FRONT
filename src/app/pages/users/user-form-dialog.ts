import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

export interface UserFormData {
  mode: 'create' | 'edit';
  user?: any;
  roles: any[];
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Nouvel Utilisateur' : 'Modifier Utilisateur' }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Nom d'utilisateur</mat-label>
          <input matInput [(ngModel)]="form.username" name="username" [disabled]="data.mode === 'edit'">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="form.email" name="email">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Prénom</mat-label>
          <input matInput [(ngModel)]="form.prenom" name="prenom">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nom</mat-label>
          <input matInput [(ngModel)]="form.nom" name="nom">
        </mat-form-field>

        @if (data.mode === 'create') {
          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input matInput type="password" [(ngModel)]="form.password" name="password">
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Rôles</mat-label>
          <mat-select [(ngModel)]="form.roleIds" name="roleIds" multiple>
            @for (role of data.roles; track role.id_role || role.id) {
              <mat-option [value]="role.id_role || role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!isValid()">
        {{ data.mode === 'create' ? 'Créer' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      min-width: 500px;
      padding-top: 10px;
    }
    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
        min-width: auto;
      }
    }
  `]
})
export class UserFormDialogComponent {
  form = {
    username: '',
    email: '',
    prenom: '',
    nom: '',
    password: '',
    roleIds: [] as number[]
  };

  constructor(
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormData
  ) {
    if (data.mode === 'edit' && data.user) {
      this.form.username = data.user.username || '';
      this.form.email = data.user.email || '';
      this.form.prenom = data.user.prenom || data.user.firstName || '';
      this.form.nom = data.user.nom || data.user.lastName || '';
      this.form.roleIds = this.extractRoleIds(data.user);
    }
  }

  private extractRoleIds(user: any): number[] {
    if (user.roleIds) return user.roleIds;
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles
        .filter((r: any) => r && (r.id_role || r.id))
        .map((r: any) => r.id_role || r.id);
    }
    return [];
  }

  isValid(): boolean {
    if (this.data.mode === 'create') {
      return !!(this.form.username && this.form.email && this.form.prenom && this.form.nom && this.form.password);
    }
    return !!(this.form.email && this.form.prenom && this.form.nom);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.form);
  }
}
