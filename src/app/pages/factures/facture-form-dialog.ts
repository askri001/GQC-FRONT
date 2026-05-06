import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  Facture,
  StatutFacture,
  TypeFacture,
  STATUT_FACTURE_LABELS,
  TYPE_FACTURE_LABELS
} from '../../core/models';

export interface FactureFormDialogData {
  isEdit: boolean;
  facture?: Facture;
}

@Component({
  selector: 'app-facture-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './facture-form-dialog.html',
  styleUrls: ['./facture-form-dialog.css'],
  encapsulation: ViewEncapsulation.None,
})
export class FactureFormDialogComponent {

  data      = inject<FactureFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<FactureFormDialogComponent>);
  snackBar  = inject(MatSnackBar);

  // ── Lookup data ────────────────────────────────────────────────
  statuts: StatutFacture[] = ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE', 'EN_RETARD'];
  types: TypeFacture[]     = ['HONORAIRES', 'FRAIS', 'EXPERTISE', 'AUTRE'];

  statutLabels = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typeLabels   = TYPE_FACTURE_LABELS   as Record<TypeFacture, string>;

  // ── Form model ─────────────────────────────────────────────────
  form = {
    numero:       this.data.facture?.numero       ?? '',
    montant:      this.data.facture?.montant       ?? null as number | null,
    typeFacture:  this.data.facture?.typeFacture   ?? 'HONORAIRES' as TypeFacture,
    statut:       this.data.facture?.statut        ?? 'EN_ATTENTE' as StatutFacture,
    dateEmission: this.toDateString(this.data.facture?.dateEmission) ?? this.toDateString(new Date())!,
    dateEcheance: this.toDateString(this.data.facture?.dateEcheance) ?? '',
    missionId:    this.data.facture?.missionId     ?? null as number | null,
    dossierId:    this.data.facture?.dossierId     ?? null as number | null,
  };

  isLoading = false;

  get isEdit(): boolean { return !!this.data.facture; }

  // ── Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isLoading) return;

    const f = this.form;

    // Validation
    if (!f.numero?.trim()) {
      this.snackBar.open('Le numéro de facture est requis.', 'OK', { duration: 3000 });
      return;
    }
    if (f.montant === null || f.montant === undefined || isNaN(Number(f.montant))) {
      this.snackBar.open('Le montant est requis.', 'OK', { duration: 3000 });
      return;
    }
    if (Number(f.montant) < 0) {
      this.snackBar.open('Le montant ne peut pas être négatif.', 'OK', { duration: 3000 });
      return;
    }
    if (!f.dateEmission) {
      this.snackBar.open('La date d\'émission est requise.', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const result: Partial<Facture> = {
      numero:       f.numero.trim(),
      montant:      Number(f.montant),
      typeFacture:  f.typeFacture,
      statut:       f.statut,
      dateEmission: new Date(f.dateEmission),
      dateEcheance: f.dateEcheance ? new Date(f.dateEcheance) : undefined,
      missionId:    f.missionId    ? Number(f.missionId)    : undefined,
      dossierId:    f.dossierId    ? Number(f.dossierId)    : undefined,
    };

    this.dialogRef.close(result);
  }

  // ── Helpers ────────────────────────────────────────────────────
  private toDateString(date?: Date | string): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().substring(0, 10);
  }
}
