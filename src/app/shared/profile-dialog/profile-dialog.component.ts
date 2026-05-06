import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="profile-dialog">

      <!-- Header with avatar -->
      <div class="profile-header">
        <div class="avatar-circle">
          <span class="avatar-initials">{{ getInitials() }}</span>
        </div>
        <div class="profile-identity">
          <h2>{{ profileData().prenom || '' }} {{ profileData().nom || '' }}</h2>
          <span class="username-badge">{{ authService.currentUser()?.username }}</span>
          <span class="role-badge">{{ getRoleLabel() }}</span>
        </div>
        <button mat-icon-button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="profile-body">

        <!-- Info section -->
        <div class="section-label">
          <mat-icon>person_outline</mat-icon>
          <span>Informations personnelles</span>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <input matInput [(ngModel)]="profileData().prenom">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput [(ngModel)]="profileData().nom">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput type="email" [(ngModel)]="profileData().email">
        </mat-form-field>

        <mat-divider></mat-divider>

        <!-- Password section -->
        <div class="section-label">
          <mat-icon>lock_outline</mat-icon>
          <span>Changer le mot de passe</span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mot de passe actuel</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput type="password" [(ngModel)]="passwordForm().current">
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nouveau mot de passe</mat-label>
            <input matInput type="password" [(ngModel)]="passwordForm().newPass">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Confirmer</mat-label>
            <input matInput type="password" [(ngModel)]="passwordForm().confirm">
          </mat-form-field>
        </div>

        @if (passwordForm().newPass && passwordForm().confirm && passwordForm().newPass !== passwordForm().confirm) {
          <div class="error-hint">
            <mat-icon>warning</mat-icon>
            Les mots de passe ne correspondent pas
          </div>
        }

      </div>

      <!-- Footer -->
      <div class="profile-footer">
        <button mat-button class="cancel-btn" (click)="close()">Annuler</button>
        <button mat-raised-button color="primary" class="save-btn"
          (click)="save()" [disabled]="saving() || !canSave()">
          @if (saving()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon>
          }
          Sauvegarder
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-dialog {
      width: 520px;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      overflow: hidden;
    }

    /* Header */
    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 28px 28px 24px;
      background: linear-gradient(135deg, #0F2044 0%, #1A3A6B 100%);
      position: relative;
    }

    .avatar-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00966E 0%, #00C48C 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(0, 196, 140, 0.4);
    }

    .avatar-initials {
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .profile-identity {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .profile-identity h2 {
      margin: 0;
      color: #fff;
      font-size: 20px;
      font-weight: 600;
    }

    .username-badge {
      color: rgba(255,255,255,0.7);
      font-size: 13px;
    }

    .role-badge {
      display: inline-block;
      background: rgba(0, 196, 140, 0.2);
      color: #00C48C;
      border: 1px solid rgba(0, 196, 140, 0.4);
      border-radius: 20px;
      padding: 2px 12px;
      font-size: 12px;
      font-weight: 600;
      width: fit-content;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      color: rgba(255,255,255,0.6) !important;
    }

    .close-btn:hover {
      color: #fff !important;
      background: rgba(255,255,255,0.1) !important;
    }

    /* Body */
    .profile-body {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #FAFBFC;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #0F2044;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .section-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #00966E;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      width: 100%;
    }

    mat-divider {
      margin: 4px 0;
    }

    .error-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #DC2626;
      font-size: 13px;
      margin-top: -8px;
    }

    .error-hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Footer */
    .profile-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 28px;
      border-top: 1px solid #E5E7EB;
      background: #fff;
    }

    .cancel-btn {
      color: #6B7280 !important;
      border: 1px solid #E5E7EB !important;
      border-radius: 8px !important;
    }

    .save-btn {
      background: linear-gradient(135deg, #0F2044 0%, #00966E 100%) !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 14px rgba(0, 150, 110, 0.3) !important;
      min-width: 130px;
    }
  `]
})
export class ProfileDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ProfileDialogComponent>);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  public authService = inject(AuthService);

  profileData = signal<any>({ prenom: '', nom: '', email: '' });
  passwordForm = signal<any>({ current: '', newPass: '', confirm: '' });
  saving = signal(false);

  ngOnInit() {
    this.api.get<any>('/users/me').subscribe({
      next: (data) => {
        this.profileData.set({
          prenom: data.prenom || '',
          nom: data.nom || '',
          email: data.email || ''
        });
      },
      error: () => {
        const user = this.authService.currentUser();
        this.profileData.set({
          prenom: user?.firstName || '',
          nom: user?.lastName || '',
          email: user?.email || ''
        });
      }
    });
  }

  getInitials(): string {
    const p = this.profileData().prenom;
    const n = this.profileData().nom;
    if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
    const username = this.authService.currentUser()?.username || 'U';
    return username[0].toUpperCase();
  }

  getRoleLabel(): string {
    const roles = this.authService.getUserRoles();
    if (roles.includes('ROLE_ADMIN')) return 'Administrateur';
    if (roles.includes('ROLE_RESPONSABLE')) return 'Responsable Contentieux';
    if (roles.includes('ROLE_CHARGEDOSSIER')) return 'Chargé de Dossier';
    return 'Utilisateur';
  }

  canSave(): boolean {
    const pf = this.passwordForm();
    // If changing password, all 3 fields required and must match
    if (pf.current || pf.newPass || pf.confirm) {
      return !!(pf.current && pf.newPass && pf.confirm && pf.newPass === pf.confirm);
    }
    return true;
  }

  save() {
    const userId = localStorage.getItem('auth_user_id');
    if (!userId) return;

    this.saving.set(true);
    const pf = this.profileData();

    this.api.put(`/users/me`, {
      prenom: pf.prenom,
      nom: pf.nom,
      email: pf.email
    }).subscribe({
      next: () => {
        const pwf = this.passwordForm();
        if (pwf.current && pwf.newPass) {
          this.api.post(`/users/me/change-password`, {
            currentPassword: pwf.current,
            newPassword: pwf.newPass
          }).subscribe({
            next: () => {
              this.saving.set(false);
              this.snackBar.open('Profil mis à jour', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
              this.dialogRef.close();
            },
            error: (err) => {
              this.saving.set(false);
              const msg = err?.error?.message || 'Mot de passe actuel incorrect';
              this.snackBar.open(msg, 'OK', { duration: 4000, panelClass: 'error-snackbar' });
            }
          });
        } else {
          this.saving.set(false);
          this.snackBar.open('Profil mis à jour', 'OK', { duration: 3000, panelClass: 'success-snackbar' });
          this.dialogRef.close();
        }
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erreur mise à jour profil', 'OK', { duration: 3000, panelClass: 'error-snackbar' });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
