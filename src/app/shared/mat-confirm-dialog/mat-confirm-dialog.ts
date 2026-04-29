import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-mat-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">{{ data.cancelText || 'Annuler' }}</button>
        <button mat-raised-button color="primary" (click)="onConfirm()">
          {{ data.confirmText || 'Confirmer' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
    }
    .confirm-dialog h2 {
      color: var(--bna-dark, #333);
      margin-bottom: 8px;
    }
    .confirm-dialog p {
      color: var(--bna-text-muted, #666);
      margin: 0;
    }
    .confirm-dialog mat-dialog-actions {
      margin-top: 16px;
      gap: 8px;
    }
  `]
})
export class MatConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<MatConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}