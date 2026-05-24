import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-drawer-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <!-- Backdrop -->
    @if (open) {
      <div class="drawer-backdrop" (click)="onClose()"></div>
    }

    <!-- Drawer -->
    <div class="drawer-panel" [class.drawer-open]="open">
      <div class="drawer-header">
        <div class="drawer-title">
          <mat-icon class="drawer-title-icon">{{ icon }}</mat-icon>
          <h3>{{ title }}</h3>
        </div>
        <button mat-icon-button class="drawer-close-btn" (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="drawer-body">
        <ng-content></ng-content>
      </div>

      <div class="drawer-footer">
        <button mat-button class="cancel-btn" (click)="onClose()" [disabled]="saving">
          Annuler
        </button>
        <button mat-raised-button color="primary" class="save-btn"
          (click)="onSave()" [disabled]="saveDisabled || saving">
          @if (saving) {
            <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
          } @else {
            <mat-icon>check</mat-icon>
          }
          {{ saveLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 32, 68, 0.45);
      z-index: 1100;
      animation: fadeIn 0.25s ease;
      backdrop-filter: blur(2px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .drawer-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100vh;
      background: #fff;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      box-shadow: -12px 0 48px rgba(15, 32, 68, 0.22);
      transform: translateX(100%);
      transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 1px solid #E5E7EB;
    }

    /* Green accent line at top */
    .drawer-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #00966E 0%, #00C48C 100%);
      z-index: 1;
    }

    .drawer-panel.drawer-open {
      transform: translateX(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: linear-gradient(135deg, #00966E 0%, #007A58 100%);
      flex-shrink: 0;
    }

    .drawer-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .drawer-title-icon {
      color: rgba(255,255,255,.90);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .drawer-title h3 {
      margin: 0;
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .drawer-close-btn {
      color: rgba(255,255,255,0.65) !important;
      transition: all 0.2s ease !important;
    }

    .drawer-close-btn:hover {
      color: #fff !important;
      background: rgba(255,255,255,0.12) !important;
      transform: rotate(90deg);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #FAFBFC;
    }

    /* Custom scrollbar */
    .drawer-body::-webkit-scrollbar {
      width: 6px;
    }
    .drawer-body::-webkit-scrollbar-track {
      background: #F1F3F5;
    }
    .drawer-body::-webkit-scrollbar-thumb {
      background: #C8D0DC;
      border-radius: 3px;
    }
    .drawer-body::-webkit-scrollbar-thumb:hover {
      background: #00966E;
    }

    /* Form fields full width + themed focus */
    .drawer-body ::ng-deep mat-form-field {
      width: 100%;
    }

    .drawer-body ::ng-deep .mat-mdc-form-field-focus-overlay {
      background: rgba(0, 150, 110, 0.04);
    }

    .drawer-body ::ng-deep .mdc-text-field--focused .mdc-notched-outline__leading,
    .drawer-body ::ng-deep .mdc-text-field--focused .mdc-notched-outline__notch,
    .drawer-body ::ng-deep .mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: #00966E !important;
    }

    .drawer-body ::ng-deep .mdc-floating-label--float-above {
      color: #00966E !important;
    }

    .drawer-footer {
      padding: 18px 28px;
      border-top: 1px solid #E5E7EB;
      box-shadow: 0 -4px 16px rgba(15, 32, 68, 0.06);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      flex-shrink: 0;
      background: #fff;
    }

    .cancel-btn {
      color: #6B7280 !important;
      border: 1px solid #E5E7EB !important;
      border-radius: 8px !important;
      padding: 0 20px !important;
      transition: all 0.2s ease !important;
    }

    .cancel-btn:hover {
      background: #F3F4F6 !important;
      color: #374151 !important;
    }

    .save-btn {
      background: #00966E !important;
      min-width: 120px;
      border-radius: 8px !important;
      font-weight: 600 !important;
      box-shadow: 0 3px 10px rgba(0, 150, 110, 0.28) !important;
      transition: all 0.2s ease !important;
    }

    .save-btn:hover:not([disabled]) {
      background: #007A58 !important;
      box-shadow: 0 5px 16px rgba(0, 150, 110, 0.38) !important;
      transform: translateY(-1px);
    }

    .save-btn[disabled] {
      opacity: 0.55 !important;
    }

    .btn-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    @media (max-width: 520px) {
      .drawer-panel {
        width: 100vw;
      }
    }
  `]
})
export class DrawerPanelComponent {
  @Input() open = false;
  @Input() title = 'Formulaire';
  @Input() icon = 'edit';
  @Input() saveLabel = 'Sauvegarder';
  @Input() saveDisabled = false;
  @Input() saving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }

  onSave() {
    this.saved.emit();
  }
}
