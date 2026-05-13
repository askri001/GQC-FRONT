import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Prestataire, TYPE_PRESTATAIRE_LABELS, TypePrestataire } from '../../core/models/prestataire.model';

@Component({
  selector: 'app-prestataire-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="detail-header">
      <mat-icon class="detail-avatar-icon">person</mat-icon>
      <div>
        <h2 class="detail-name">{{ data.prenom }} {{ data.nom }}</h2>
        <span class="detail-type-badge">{{ typeLabel }}</span>
      </div>
      <button mat-icon-button mat-dialog-close class="detail-close">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="detail-content">

      <div class="detail-section">
        <div class="detail-row">
          <mat-icon class="detail-icon">phone</mat-icon>
          <div class="detail-field">
            <span class="detail-label">Téléphone</span>
            <span class="detail-value">{{ data.telephone || '—' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <mat-icon class="detail-icon">email</mat-icon>
          <div class="detail-field">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ data.email || '—' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <mat-icon class="detail-icon">location_on</mat-icon>
          <div class="detail-field">
            <span class="detail-label">Adresse</span>
            <span class="detail-value">{{ data.adresse || '—' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <mat-icon class="detail-icon">work</mat-icon>
          <div class="detail-field">
            <span class="detail-label">Spécialité</span>
            <span class="detail-value">{{ data.specialite || '—' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <mat-icon class="detail-icon">payments</mat-icon>
          <div class="detail-field">
            <span class="detail-label">Tarif journalier</span>
            <span class="detail-value">{{ data.tarifJournalier | number:'1.0-0' }} DT</span>
          </div>
        </div>
        <div class="detail-row">
          <mat-icon class="detail-icon">account_balance</mat-icon>
          <div class="detail-field">
            <span class="detail-label">RIB</span>
            <span class="detail-value rib-value">{{ data.rib || '—' }}</span>
          </div>
        </div>
        <div class="detail-row">
          <mat-icon class="detail-icon" [style.color]="data.actif ? '#00966E' : '#c62828'">
            {{ data.actif ? 'check_circle' : 'cancel' }}
          </mat-icon>
          <div class="detail-field">
            <span class="detail-label">Statut</span>
            <span class="detail-value"
                  [style.color]="data.actif ? '#00966E' : '#c62828'"
                  [style.fontWeight]="'600'">
              {{ data.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>
        </div>
      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e0f5ee;
      position: relative;
    }

    .detail-avatar-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #00966E;
      background: rgba(0,150,110,.10);
      border-radius: 50%;
      padding: 8px;
    }

    .detail-name {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 700;
      color: #1a2e28;
    }

    .detail-type-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(0,150,110,.12);
      color: #00966E;
    }

    .detail-close {
      position: absolute;
      right: 12px;
      top: 12px;
      color: #7aada0;
    }

    .detail-content {
      padding: 16px 24px 8px !important;
    }

    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 0;
      border-bottom: 1px solid #f0faf6;
    }

    .detail-row:last-child { border-bottom: none; }

    .detail-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: #7aada0;
      flex-shrink: 0;
    }

    .detail-field {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .detail-label {
      font-size: 11px;
      color: #7aada0;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 500;
    }

    .detail-value {
      font-size: 14px;
      color: #1a2e28;
      font-weight: 500;
    }

    .rib-value {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 1px;
      color: #007A58;
    }
  `]
})
export class PrestataireDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PrestataireDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Prestataire
  ) {}

  get typeLabel(): string {
    const type = (this.data.typePrestataire ?? this.data.type) as TypePrestataire;
    return TYPE_PRESTATAIRE_LABELS[type] ?? type ?? '—';
  }
}
