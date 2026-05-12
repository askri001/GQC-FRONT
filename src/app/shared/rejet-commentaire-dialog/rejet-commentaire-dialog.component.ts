import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface RejetDialogData {
  titre: string;
  sousTitre?: string;
}

@Component({
  selector: 'app-rejet-commentaire-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="color:#c62828;vertical-align:middle;margin-right:8px">cancel</mat-icon>
      {{ data.titre }}
    </h2>

    <mat-dialog-content>
      @if (data.sousTitre) {
        <p style="color:#555;margin-bottom:16px;font-size:13px">{{ data.sousTitre }}</p>
      }
      <mat-form-field appearance="outline" class="bna-field" style="width:100%">
        <mat-label>Motif du rejet (optionnel)</mat-label>
        <mat-icon matPrefix>comment</mat-icon>
        <textarea matInput
          [(ngModel)]="commentaire"
          rows="4"
          placeholder="Expliquez la raison du rejet pour que le chargé de dossier puisse corriger...">
        </textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button mat-raised-button
        style="background:linear-gradient(135deg,#c62828,#e53935)!important;color:#fff!important;border-radius:8px!important"
        (click)="confirmer()"
        type="button">
        <mat-icon>cancel</mat-icon>
        Rejeter
      </button>
    </mat-dialog-actions>
  `
})
export class RejetCommentaireDialogComponent {
  data = inject<RejetDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<RejetCommentaireDialogComponent>);

  commentaire = '';

  confirmer(): void {
    // Returns the comment (empty string if none — still a confirmation)
    this.dialogRef.close(this.commentaire.trim() || undefined);
  }
}
