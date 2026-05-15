import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MessageService } from '../../core/services/message.service';
import { Message } from '../../core/models/message.model';
import { Router } from '@angular/router';

export interface ViewMessageDialogData {
  message: Message;
}

@Component({
  selector: 'app-view-message-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatDividerModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <div class="msg-dialog">
      <!-- Header -->
      <div class="msg-header">
        <div class="msg-header-left">
          <mat-icon class="msg-icon">mail</mat-icon>
          <div>
            <h2 class="msg-subject">{{ data.message.subject }}</h2>
            <p class="msg-meta">
              De : <strong>{{ data.message.fromUsername }}</strong>
              @if (data.message.entityType) {
                &nbsp;·&nbsp;
                <span class="msg-entity-badge">
                  <mat-icon style="font-size:13px;width:13px;height:13px;vertical-align:middle">
                    {{ getEntityIcon(data.message.entityType) }}
                  </mat-icon>
                  {{ data.message.entityType }} #{{ data.message.entityId }}
                </span>
              }
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Body -->
      <div class="msg-body">
        <p>{{ data.message.body }}</p>
      </div>

      <!-- Link to entity -->
      @if (data.message.entityType && data.message.entityId) {
        <div class="msg-link-bar">
          <mat-icon>link</mat-icon>
          <span>Lié à {{ data.message.entityType }} #{{ data.message.entityId }}</span>
          <button mat-stroked-button (click)="goToEntity()">
            <mat-icon>open_in_new</mat-icon>
            Voir
          </button>
        </div>
      }

      <mat-divider></mat-divider>

      <!-- Reply -->
      <div class="msg-reply">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Répondre...</mat-label>
          <textarea matInput [(ngModel)]="replyBody" rows="3"
            placeholder="Écrivez votre réponse ici..."></textarea>
        </mat-form-field>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
          <button mat-button mat-dialog-close>Fermer</button>
          <button mat-raised-button color="primary"
            [disabled]="!replyBody.trim() || sending"
            (click)="sendReply()">
            <mat-icon>reply</mat-icon>
            {{ sending ? 'Envoi...' : 'Répondre' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .msg-dialog { min-width: 480px; max-width: 600px; }
    .msg-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 20px 16px; }
    .msg-header-left { display: flex; align-items: flex-start; gap: 12px; }
    .msg-icon { color: #00966E; font-size: 28px; width: 28px; height: 28px; margin-top: 2px; }
    .msg-subject { margin: 0; font-size: 16px; font-weight: 700; color: #1a2e28; }
    .msg-meta { margin: 4px 0 0; font-size: 12px; color: #7aada0; }
    .msg-entity-badge { display: inline-flex; align-items: center; gap: 3px; background: #e0f5ee; color: #00966E; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .msg-body { padding: 16px 20px; font-size: 14px; color: #2d4a42; line-height: 1.6; white-space: pre-wrap; min-height: 80px; }
    .msg-link-bar { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #f7fdfb; font-size: 13px; color: #00966E; }
    .msg-link-bar mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .msg-reply { padding: 16px 20px; }
  `]
})
export class ViewMessageDialogComponent {
  data      = inject<ViewMessageDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ViewMessageDialogComponent>);
  snackBar  = inject(MatSnackBar);
  private messageService = inject(MessageService);
  private router         = inject(Router);

  replyBody = '';
  sending   = false;

  getEntityIcon(type: string): string {
    const map: Record<string, string> = {
      DOSSIER: 'folder', AFFAIRE: 'gavel', MISSION: 'assignment', FACTURE: 'receipt'
    };
    return map[type] ?? 'link';
  }

  goToEntity(): void {
    const routes: Record<string, string> = {
      DOSSIER: '/dossiers', AFFAIRE: '/affaires', MISSION: '/missions', FACTURE: '/factures'
    };
    const route = routes[this.data.message.entityType ?? ''];
    if (route) {
      this.router.navigate([route]);
      this.dialogRef.close();
    }
  }

  sendReply(): void {
    if (!this.replyBody.trim()) return;
    this.sending = true;
    this.messageService.send({
      toUserId:   this.data.message.fromUserId,
      subject:    `RE: ${this.data.message.subject}`,
      body:       this.replyBody.trim(),
      entityType: this.data.message.entityType,
      entityId:   this.data.message.entityId,
    }).subscribe({
      next: () => {
        this.snackBar.open('Réponse envoyée', 'OK', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'envoi', 'OK', { duration: 3000 });
        this.sending = false;
      }
    });
  }
}
