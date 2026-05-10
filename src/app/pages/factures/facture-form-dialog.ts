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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  Facture,
  StatutFacture,
  TypeFacture,
  STATUT_FACTURE_LABELS,
  TYPE_FACTURE_LABELS
} from '../../core/models';

import { MissionService } from '../../core/services/mission.service';
import { AffaireService } from '../../core/services/affaire.service';
import { Mission } from '../../core/models/mission.model';
import { Affaire } from '../../core/models/affaire.model';

export interface FactureFormDialogData {
  isEdit: boolean;
  facture?: Facture;
}

// UI-only concept: controls which linked-entity dropdown is shown
type LienType = 'MISSION' | 'AFFAIRE';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './facture-form-dialog.html',
  styleUrls: ['./facture-form-dialog.css'],
  encapsulation: ViewEncapsulation.None,
})
export class FactureFormDialogComponent implements OnInit {

  data      = inject<FactureFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<FactureFormDialogComponent>);
  snackBar  = inject(MatSnackBar);
  private missionService = inject(MissionService);
  private affaireService = inject(AffaireService);

  // ── Lookup data ────────────────────────────────────────────────
  statuts: StatutFacture[] = ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE', 'EN_RETARD'];
  types: TypeFacture[]     = ['HONORAIRES', 'FRAIS', 'EXPERTISE', 'AUTRE'];

  statutLabels = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typeLabels   = TYPE_FACTURE_LABELS   as Record<TypeFacture, string>;

  // ── Filtered lists (TERMINEE only) ────────────────────────────
  termineesMissions: Mission[] = [];
  termineesAffaires: Affaire[] = [];

  // ── lienType: UI-only selector (MISSION / AFFAIRE) ────────────
  lienType: LienType = this.data.facture?.missionId ? 'MISSION' : 'MISSION';
  linkedMissionId: number | null = this.data.facture?.missionId ?? null;
  linkedAffaireId: number | null = null;

  // ── Form model (dates removed) ─────────────────────────────────
  form = {
    numero:      this.data.facture?.numero      ?? '',
    montant:     this.data.facture?.montant      ?? null as number | null,
    typeFacture: this.data.facture?.typeFacture  ?? 'HONORAIRES' as TypeFacture,
    // status: EN_ATTENTE on create, preserved on edit
    statut:      this.data.facture?.statut       ?? 'EN_ATTENTE' as StatutFacture,
  };

  isLoading = false;

  get isEdit(): boolean { return !!this.data.facture; }

  // ── Init ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadTermineesMissions();
    this.loadTermineesAffaires();
  }

  // ── Load TERMINEE missions ─────────────────────────────────────
  loadTermineesMissions(): void {
    this.missionService.getAll().subscribe({
      next: (data) => {
        this.termineesMissions = (data ?? []).filter(m => m.statut === 'TERMINEE');
      },
      error: () => this.termineesMissions = [],
    });
  }

  getMissionLabel(m: Mission): string {
    return `Mission #${m.id} — ${m.typeMission}${m.dossierId ? ' (Dossier ' + m.dossierId + ')' : ''}`;
  }

  // ── Load TERMINEE affaires ─────────────────────────────────────
  loadTermineesAffaires(): void {
    this.affaireService.getAll().subscribe({
      next: (data) => {
        this.termineesAffaires = (data ?? []).filter(a => a.statut === 'TERMINEE');
      },
      error: () => this.termineesAffaires = [],
    });
  }

  getAffaireLabel(a: Affaire): string {
    return a.numeroProcedure
      ? `${a.numeroProcedure} — ${a.tribunal ?? ''}`
      : `Affaire #${a.idAffaire ?? a.id}`;
  }

  // ── On lienType change → reset linked selection ────────────────
  onLienTypeChange(): void {
    this.linkedMissionId = null;
    this.linkedAffaireId = null;
  }

  // ── Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isLoading) return;

    const f = this.form;

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

    this.isLoading = true;

    // Backend FactureDTO only has missionId — affaireId has no backend field
    // When lienType = AFFAIRE, dossierId is used as the closest available field
    const result: Partial<Facture> = {
      numero:      f.numero.trim(),
      montant:     Number(f.montant),
      typeFacture: f.typeFacture,
      statut:      this.isEdit ? f.statut : 'EN_ATTENTE',
      missionId:   this.lienType === 'MISSION' && this.linkedMissionId
                     ? Number(this.linkedMissionId) : undefined,
      dossierId:   this.lienType === 'AFFAIRE' && this.linkedAffaireId
                     ? Number(this.linkedAffaireId) : undefined,
    };

    this.dialogRef.close(result);
  }
}
