import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ConfirmStatusDialogData {
  /** true = on veut activer, false = on veut désactiver */
  activate: boolean;
  prestataireName: string;
}

@Component({
  selector: 'app-confirm-prestataire-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="csd-overlay">
      <div class="csd-card" [class.csd-activate]="data.activate" [class.csd-deactivate]="!data.activate">

        <!-- Icon header -->
        <div class="csd-icon-wrap">
          <mat-icon class="csd-icon">{{ data.activate ? 'check_circle' : 'cancel' }}</mat-icon>
        </div>

        <!-- Title -->
        <h2 class="csd-title">Confirmation</h2>

        <!-- Message -->
        <p class="csd-message">
          Voulez-vous <strong>{{ data.activate ? 'activer' : 'désactiver' }}</strong>
          le prestataire <strong>{{ data.prestataireName }}</strong> ?
        </p>

        <!-- Actions -->
        <div class="csd-actions">
          <button
            class="csd-btn csd-btn-cancel"
            [disabled]="loading()"
            (click)="cancel()">
            Annuler
          </button>

          <button
            class="csd-btn"
            [class.csd-btn-activate]="data.activate"
            [class.csd-btn-deactivate]="!data.activate"
            [disabled]="loading()"
            (click)="confirm()">
            @if (loading()) {
              <mat-spinner diameter="18" class="csd-spinner"></mat-spinner>
            } @else {
              <mat-icon class="csd-btn-icon">{{ data.activate ? 'check' : 'block' }}</mat-icon>
            }
            {{ loading() ? 'En cours...' : 'Oui' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Wrapper ── */
    .csd-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .csd-card {
      width: 380px;
      max-width: 95vw;
      padding: 36px 32px 28px;
      border-radius: 16px;
      background: #fff;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    /* Top accent bar */
    .csd-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 5px;
      border-radius: 16px 16px 0 0;
    }

    .csd-activate::before  { background: #00966E; }
    .csd-deactivate::before { background: #c62828; }

    /* ── Icon ── */
    .csd-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
    }

    .csd-activate  .csd-icon-wrap { background: rgba(0,150,110,.12); }
    .csd-deactivate .csd-icon-wrap { background: rgba(198,40,40,.10); }

    .csd-icon {
      font-size: 34px !important;
      height: 34px !important;
      width: 34px !important;
    }

    .csd-activate  .csd-icon { color: #00966E; }
    .csd-deactivate .csd-icon { color: #c62828; }

    /* ── Title ── */
    .csd-title {
      margin: 0 0 12px;
      font-size: 20px;
      font-weight: 700;
      color: #1a2e28;
    }

    /* ── Message ── */
    .csd-message {
      margin: 0 0 28px;
      font-size: 15px;
      color: #4a6860;
      line-height: 1.55;
    }

    /* ── Actions ── */
    .csd-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .csd-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 42px;
      padding: 0 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background .18s, transform .12s, opacity .15s;
      min-width: 110px;
    }

    .csd-btn:disabled {
      opacity: .6;
      cursor: not-allowed;
      transform: none !important;
    }

    .csd-btn:not(:disabled):hover { transform: translateY(-1px); }
    .csd-btn:not(:disabled):active { transform: translateY(0); }

    /* Cancel */
    .csd-btn-cancel {
      background: #f0f4f2;
      color: #4a6860;
      border: 1.5px solid #d4e8e0;
    }
    .csd-btn-cancel:not(:disabled):hover { background: #e2ede8; }

    /* Activate — green */
    .csd-btn-activate {
      background: #00966E;
      color: #fff;
      box-shadow: 0 3px 10px rgba(0,150,110,.28);
    }
    .csd-btn-activate:not(:disabled):hover { background: #007A58; }

    /* Deactivate — red */
    .csd-btn-deactivate {
      background: #c62828;
      color: #fff;
      box-shadow: 0 3px 10px rgba(198,40,40,.25);
    }
    .csd-btn-deactivate:not(:disabled):hover { background: #a81f1f; }

    /* Spinner inside button */
    .csd-spinner { display: inline-block; }
    ::ng-deep .csd-spinner circle { stroke: #fff !important; }

    /* Icon inside button */
    .csd-btn-icon {
      font-size: 17px !important;
      height: 17px !important;
      width: 17px !important;
    }
  `],
})
export class ConfirmPrestataireStatusDialogComponent {

  loading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<ConfirmPrestataireStatusDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmStatusDialogData,
  ) {
    dialogRef.disableClose = false;
  }

  confirm(): void {
    this.loading.set(true);
    this.dialogRef.disableClose = true;
    this.dialogRef.close(true);
  }

  cancel(): void {
    if (this.loading()) return;
    this.dialogRef.close(false);
  }
}
