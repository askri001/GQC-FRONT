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
import { ApiService } from '../../core/services/api.service';
import { Mission, TYPE_MISSION_LABELS } from '../../core/models/mission.model';
import { Affaire } from '../../core/models/affaire.model';
import { Dossier } from '../../core/models/dossier.model';

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
  private api            = inject(ApiService);

  // ── Lookup data ────────────────────────────────────────────────
  statuts: StatutFacture[] = ['EN_ATTENTE_VALIDATION', 'VALIDEE', 'PAYEE', 'REJETEE', 'EN_RETARD'];
  types: TypeFacture[]     = ['HONORAIRES', 'FRAIS', 'EXPERTISE', 'AUTRE'];
  missionTypeLabels        = TYPE_MISSION_LABELS;

  statutLabels = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typeLabels   = TYPE_FACTURE_LABELS   as Record<TypeFacture, string>;

  // ── Guided selection state ─────────────────────────────────────
  dossiers:  Dossier[]  = [];
  allAffaires: Affaire[] = [];
  allMissions: Mission[] = [];

  selectedDossierId:  number | null = null;
  selectedAffaireId:  number | null = null;

  // ── Form model ─────────────────────────────────────────────────
  form = {
    numero:      this.data.facture?.numero     ?? '',
    montant:     this.data.facture?.montant    ?? null as number | null,
    typeFacture: this.data.facture?.typeFacture ?? 'HONORAIRES' as TypeFacture,
    statut:      this.data.facture?.statut     ?? 'EN_ATTENTE_VALIDATION' as StatutFacture,
    missionId:   this.data.facture?.missionId  ?? null as number | null,
  };

  isLoading = false;
  get isEdit(): boolean { return !!this.data.facture; }

  // ── Filtered lists ─────────────────────────────────────────────
  get filteredAffaires(): Affaire[] {
    if (!this.selectedDossierId) return [];
    return this.allAffaires.filter(a => a.dossierId === this.selectedDossierId);
  }

  get filteredMissions(): Mission[] {
    if (!this.selectedAffaireId) return [];
    return this.allMissions.filter(m => m.affaireId === this.selectedAffaireId);
  }

  // ── Init ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => this.dossiers = data ?? [],
      error: () => {}
    });
    this.affaireService.getAll().subscribe({
      next: (data) => {
        this.allAffaires = data ?? [];
        // Pre-fill when editing
        if (this.form.missionId) this.prefillFromMission();
      },
      error: () => {}
    });
    this.missionService.getAll().subscribe({
      next: (data) => {
        this.allMissions = data ?? [];
        if (this.form.missionId) this.prefillFromMission();
      },
      error: () => {}
    });
  }

  /** When editing, pre-fill dossier and affaire selects from the existing missionId */
  private prefillFromMission(): void {
    if (!this.form.missionId || !this.allMissions.length || !this.allAffaires.length) return;
    const mission = this.allMissions.find(m => m.id === this.form.missionId);
    if (!mission?.affaireId) return;
    const affaire = this.allAffaires.find(a => (a.idAffaire ?? a.id) === mission.affaireId);
    if (!affaire) return;
    this.selectedAffaireId = mission.affaireId;
    this.selectedDossierId = affaire.dossierId;
  }

  onDossierChange(): void {
    this.selectedAffaireId = null;
    this.form.missionId    = null;
  }

  onAffaireChange(): void {
    this.form.missionId = null;
  }

  getMissionLabel(m: Mission): string {
    return `${this.missionTypeLabels[m.typeMission] ?? m.typeMission}`;
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
    if (Number(f.montant) <= 0) {
      this.snackBar.open('Le montant doit être supérieur à 0.', 'OK', { duration: 3000 });
      return;
    }
    if (!f.missionId) {
      this.snackBar.open('Veuillez sélectionner une mission.', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const result: Partial<Facture> = {
      numero:      f.numero.trim(),
      montant:     Number(f.montant),
      typeFacture: f.typeFacture,
      statut:      this.isEdit ? f.statut : 'EN_ATTENTE_VALIDATION',
      missionId:   Number(f.missionId),
    };

    this.dialogRef.close(result);
  }
}
