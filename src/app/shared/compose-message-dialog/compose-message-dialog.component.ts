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
import { MessageService } from '../../core/services/message.service';
import { ApiService } from '../../core/services/api.service';
import { Message } from '../../core/models/message.model';

export interface ComposeDialogData {
  toUserId?: number;
  toUsername?: string;
  subject?: string;
  entityType?: string;
  entityId?: number;
}

@Component({
  selector: 'app-compose-message-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px;color:#00966E">mail</mat-icon>
      Nouveau Message
    </h2>

    <mat-dialog-content>
      <div style="display:flex;flex-direction:column;gap:12px;min-width:420px">

        <mat-form-field appearance="outline">
          <mat-label>Destinataire *</mat-label>
          <mat-icon matPrefix>person</mat-icon>
          <mat-select [(ngModel)]="form.toUserId">
            @for (u of users; track u.id) {
              <mat-option [value]="u.id">{{ u.prenom || '' }} {{ u.nom || '' }} ({{ u.username }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sujet *</mat-label>
          <mat-icon matPrefix>subject</mat-icon>
          <input matInput [(ngModel)]="form.subject" placeholder="Ex: Question sur le dossier DOS-2024-001">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Lié à (optionnel)</mat-label>
          <mat-icon matPrefix>link</mat-icon>
          <mat-select [(ngModel)]="form.entityType" (ngModelChange)="form.entityId = undefined">
            <mat-option [value]="undefined">Aucun</mat-option>
            <mat-option value="DOSSIER">Dossier</mat-option>
            <mat-option value="AFFAIRE">Affaire</mat-option>
            <mat-option value="MISSION">Mission</mat-option>
            <mat-option value="FACTURE">Facture</mat-option>
          </mat-select>
        </mat-form-field>

        @if (form.entityType) {
          <mat-form-field appearance="outline">
            <mat-label>ID de l'élément lié</mat-label>
            <mat-icon matPrefix>tag</mat-icon>
            <input matInput type="number" [(ngModel)]="form.entityId" placeholder="Ex: 5">
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Message *</mat-label>
          <textarea matInput [(ngModel)]="form.body" rows="5"
            placeholder="Écrivez votre message ici..."></textarea>
        </mat-form-field>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSend()"
        [disabled]="!form.toUserId || !form.subject?.trim() || !form.body?.trim() || sending">
        <mat-icon>send</mat-icon>
        {{ sending ? 'Envoi...' : 'Envoyer' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ComposeMessageDialogComponent implements OnInit {
  data      = inject<ComposeDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ComposeMessageDialogComponent>);
  snackBar  = inject(MatSnackBar);
  private messageService = inject(MessageService);
  private api            = inject(ApiService);

  users: any[] = [];
  sending = false;

  form: Partial<Message> = {
    toUserId:   this.data.toUserId,
    subject:    this.data.subject ?? '',
    body:       '',
    entityType: this.data.entityType as any,
    entityId:   this.data.entityId,
  };

  ngOnInit(): void {
    // Load all users that the current user can message
    // Use /api/users/me to get current user, then load all users via a combined approach
    this.api.get<any[]>('/users/chargedossiers').subscribe({
      next: (cds) => {
        this.api.get<any[]>('/users').subscribe({
          next: (all) => { this.users = all ?? []; },
          error: () => {
            // If admin endpoint fails, use chargedossiers only
            this.users = cds ?? [];
          }
        });
      },
      error: () => {
        // Fallback: try admin endpoint
        this.api.get<any[]>('/users').subscribe({
          next: (data) => this.users = data ?? [],
          error: () => this.users = []
        });
      }
    });
  }

  onSend(): void {
    if (!this.form.toUserId || !this.form.subject?.trim() || !this.form.body?.trim()) return;
    this.sending = true;
    this.messageService.send(this.form).subscribe({
      next: () => {
        this.snackBar.open('Message envoyé', 'OK', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'envoi', 'OK', { duration: 3000 });
        this.sending = false;
      }
    });
  }
}
