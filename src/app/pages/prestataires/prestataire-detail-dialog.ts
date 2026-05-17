import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Prestataire, TYPE_PRESTATAIRE_LABELS, TypePrestataire } from '../../core/models/prestataire.model';

@Component({
  selector: 'app-prestataire-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="pd-header">
      <div class="pd-avatar">
        <mat-icon>person</mat-icon>
      </div>
      <div class="pd-header-info">
        <h2 class="pd-name">{{ data.prenom }} {{ data.nom }}</h2>
        <div class="pd-badges">
          <span class="pd-badge pd-badge-type">{{ typeLabel }}</span>
          <span class="pd-badge" [class.pd-badge-active]="data.actif" [class.pd-badge-inactive]="!data.actif">
            <mat-icon class="pd-badge-icon">{{ data.actif ? 'check_circle' : 'cancel' }}</mat-icon>
            {{ data.actif ? 'Actif' : 'Inactif' }}
          </span>
        </div>
      </div>
      <button class="pd-close-btn" mat-dialog-close title="Fermer">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="pd-content">

      <!-- ── SECTION 1 : COORDONNÉES ──────────────────────────── -->
      <div class="pd-section">
        <div class="pd-section-title">
          <mat-icon>contact_phone</mat-icon>
          Coordonnées
        </div>
        <div class="pd-grid">

          <div class="pd-field">
            <div class="pd-field-label">
              <mat-icon>person</mat-icon> Nom complet
            </div>
            <div class="pd-field-value">{{ data.prenom }} {{ data.nom }}</div>
          </div>

          <div class="pd-field">
            <div class="pd-field-label">
              <mat-icon>work</mat-icon> Spécialité
            </div>
            <div class="pd-field-value">{{ data.specialite || '—' }}</div>
          </div>

          <div class="pd-field">
            <div class="pd-field-label">
              <mat-icon>phone</mat-icon> Téléphone
            </div>
            <div class="pd-field-value">{{ data.telephone || '—' }}</div>
          </div>

          <div class="pd-field">
            <div class="pd-field-label">
              <mat-icon>email</mat-icon> Email
            </div>
            <div class="pd-field-value pd-field-email">{{ data.email || '—' }}</div>
          </div>

          <div class="pd-field pd-field-full">
            <div class="pd-field-label">
              <mat-icon>location_on</mat-icon> Adresse
            </div>
            <div class="pd-field-value">{{ data.adresse || '—' }}</div>
          </div>

          <div class="pd-field">
            <div class="pd-field-label">
              <mat-icon>payments</mat-icon> Tarif journalier
            </div>
            <div class="pd-field-value pd-field-tarif">
              {{ data.tarifJournalier | number:'1.0-0' }} <span class="pd-currency">DT</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ── SECTION 2 : BANCAIRE / RIB ───────────────────────── -->
      <div class="pd-section pd-section-bank">
        <div class="pd-section-title">
          <mat-icon>account_balance</mat-icon>
          Informations Bancaires
        </div>

        <div class="pd-rib-card">
          <div class="pd-rib-label">
            <mat-icon>credit_card</mat-icon>
            RIB Bancaire
          </div>
          <div class="pd-rib-row">
            <span class="pd-rib-value">{{ data.rib || '—' }}</span>
            @if (data.rib) {
              <button class="pd-copy-btn"
                (click)="copyRib()"
                [matTooltip]="copied() ? 'Copie !' : 'Copier le RIB'"
                matTooltipPosition="above">
                <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
              </button>
            }
          </div>
          @if (data.rib) {
            <div class="pd-rib-hint">Cliquez sur l'icône pour copier</div>
          }
        </div>

      </div>

    </mat-dialog-content>

    <!-- ── FOOTER ─────────────────────────────────────────────── -->
    <mat-dialog-actions class="pd-actions">
      <button class="pd-close-footer-btn" mat-dialog-close>
        <mat-icon>close</mat-icon>
        Fermer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }

    /* ── Header ─────────────────────────────────────────────── */
    .pd-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 20px;
      background: linear-gradient(135deg, #f0faf6 0%, #e6f5f0 100%);
      border-bottom: 2px solid #b2dfd1;
      position: relative;
    }

    .pd-avatar {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #00966E, #00c48c);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0,150,110,.3);
    }
    .pd-avatar mat-icon {
      color: #fff;
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
    }

    .pd-header-info { flex: 1; min-width: 0; }

    .pd-name {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 700;
      color: #1a2e28;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pd-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pd-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .pd-badge-icon {
      font-size: 13px !important;
      width: 13px !important;
      height: 13px !important;
    }

    .pd-badge-type {
      background: rgba(0,150,110,.12);
      color: #007A58;
      border: 1px solid rgba(0,150,110,.2);
    }

    .pd-badge-active {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
    }

    .pd-badge-inactive {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
    }

    .pd-close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #b2dfd1;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #7aada0;
      transition: all .15s;
    }
    .pd-close-btn:hover { background: #f0faf6; color: #00966E; }
    .pd-close-btn mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }

    /* ── Content ─────────────────────────────────────────────── */
    .pd-content {
      padding: 0 !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    /* ── Section ─────────────────────────────────────────────── */
    .pd-section {
      padding: 20px 24px;
      border-bottom: 1px solid #eef5f2;
    }

    .pd-section-bank {
      background: #fafcfb;
    }

    .pd-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #7aada0;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 16px;
    }
    .pd-section-title mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #00966E;
    }

    /* ── Grid fields ─────────────────────────────────────────── */
    .pd-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .pd-field {
      background: #fff;
      border: 1px solid #e8f0ed;
      border-radius: 10px;
      padding: 12px 14px;
    }

    .pd-field-full {
      grid-column: 1 / -1;
    }

    .pd-field-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10.5px;
      font-weight: 600;
      color: #9ab5ae;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 5px;
    }
    .pd-field-label mat-icon {
      font-size: 13px !important;
      width: 13px !important;
      height: 13px !important;
      color: #00966E;
    }

    .pd-field-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a2e28;
      word-break: break-word;
    }

    .pd-field-email { color: #1565c0; }

    .pd-field-tarif {
      font-size: 16px;
      color: #00966E;
    }

    .pd-currency {
      font-size: 12px;
      font-weight: 500;
      color: #7aada0;
    }

    /* ── RIB card ────────────────────────────────────────────── */
    .pd-rib-card {
      background: #fff;
      border: 1.5px solid #b2dfd1;
      border-radius: 12px;
      padding: 16px 18px;
    }

    .pd-rib-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #7aada0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .pd-rib-label mat-icon {
      font-size: 15px !important;
      width: 15px !important;
      height: 15px !important;
      color: #00966E;
    }

    .pd-rib-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .pd-rib-value {
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: 700;
      color: #007A58;
      letter-spacing: 2px;
      word-break: break-all;
    }

    .pd-copy-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid #b2dfd1;
      background: #f0faf6;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #00966E;
      transition: all .15s;
    }
    .pd-copy-btn:hover { background: #e0f5ee; box-shadow: 0 2px 8px rgba(0,150,110,.2); }
    .pd-copy-btn mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }

    .pd-rib-hint {
      margin-top: 6px;
      font-size: 11px;
      color: #b2c8c2;
      font-style: italic;
    }

    /* ── Footer ─────────────────────────────────────────────── */
    .pd-actions {
      padding: 14px 24px !important;
      border-top: 1px solid #eef5f2;
      justify-content: flex-end !important;
    }

    .pd-close-footer-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      border-radius: 9px;
      border: 1px solid #b2dfd1;
      background: #f0faf6;
      color: #007A58;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }
    .pd-close-footer-btn:hover { background: #e0f5ee; }
    .pd-close-footer-btn mat-icon { font-size: 17px !important; width: 17px !important; height: 17px !important; }

    /* ── Responsive ─────────────────────────────────────────── */
    @media (max-width: 480px) {
      .pd-grid { grid-template-columns: 1fr; }
      .pd-field-full { grid-column: 1; }
      .pd-name { font-size: 17px; }
    }
  `]
})
export class PrestataireDetailDialogComponent {

  copied = signal(false);

  constructor(
    public dialogRef: MatDialogRef<PrestataireDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Prestataire
  ) {}

  get typeLabel(): string {
    const type = (this.data.typePrestataire ?? this.data.type) as TypePrestataire;
    return TYPE_PRESTATAIRE_LABELS[type] ?? type ?? '—';
  }

  copyRib(): void {
    if (!this.data.rib) return;
    navigator.clipboard.writeText(this.data.rib).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = this.data.rib!;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
