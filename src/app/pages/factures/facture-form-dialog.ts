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
  TypePaiement,
  STATUT_FACTURE_LABELS,
  TYPE_PAIEMENT_LABELS,
} from '../../core/models';

import { MissionService }     from '../../core/services/mission.service';
import { DossierService }     from '../../core/services/dossier.service';
import { AffaireService }     from '../../core/services/affaire.service';
import { PrestataireService } from '../../core/services/prestataire.service';
import { Mission, TYPE_MISSION_LABELS } from '../../core/models/mission.model';
import { Dossier }     from '../../core/models/dossier.model';
import { Affaire }     from '../../core/models/affaire.model';
import { Prestataire } from '../../core/models/prestataire.model';

export interface FactureFormDialogData {
  isEdit: boolean;
  facture?: Facture;
}

// Lien type: via Dossier (→ mission) ou via Affaire directement
type LienType = 'DOSSIER' | 'AFFAIRE';

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

  data       = inject<FactureFormDialogData>(MAT_DIALOG_DATA);
  dialogRef  = inject(MatDialogRef<FactureFormDialogComponent>);
  snackBar   = inject(MatSnackBar);

  private missionService     = inject(MissionService);
  private dossierService     = inject(DossierService);
  private affaireService     = inject(AffaireService);
  private prestataireService = inject(PrestataireService);

  // ── Lookup lists ───────────────────────────────────────────────
  statuts: StatutFacture[]      = ['EN_ATTENTE_VALIDATION', 'VALIDEE', 'REJETEE', 'PAYEE'];
  typesPaiement: TypePaiement[] = ['CHEQUE_BCT', 'VIREMENT'];

  statutLabels       = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typePaiementLabels = TYPE_PAIEMENT_LABELS  as Record<TypePaiement, string>;
  missionTypeLabels  = TYPE_MISSION_LABELS;

  dossiers: Dossier[] = [];
  affaires: Affaire[] = [];

  // ── Lien type selector ─────────────────────────────────────────
  lienType: LienType = 'DOSSIER';

  // ── Auto-filled state ──────────────────────────────────────────
  missionsForDossier: Mission[]           = [];
  selectedPrestataire: Prestataire | null = null;
  lienError: string | null                = null;
  loadingLienData                         = false;

  // ── Form model ─────────────────────────────────────────────────
  form = {
    numero:       this.data.facture?.numero       ?? '',
    montant:      this.data.facture?.montant      ?? null as number | null,
    statut:       this.data.facture?.statut       ?? ('EN_ATTENTE_VALIDATION' as StatutFacture),
    typePaiement: this.data.facture?.typePaiement ?? null as TypePaiement | null,
    dossierId:    this.data.facture?.dossierId    ?? null as number | null,
    missionId:    this.data.facture?.missionId    ?? null as number | null,
    affaireId:    null as number | null,
  };

  isLoading = false;
  get isEdit(): boolean { return !!this.data.facture; }

  // ── Computed getters ───────────────────────────────────────────
  get prestataireNom(): string {
    if (!this.selectedPrestataire) return '';
    return `${this.selectedPrestataire.prenom} ${this.selectedPrestataire.nom}`;
  }

  get prestataireRib(): string {
    return this.selectedPrestataire?.rib || '—';
  }

  get prestataireType(): string {
    const p = this.selectedPrestataire;
    if (!p) return '';
    return (p.typePrestataire ?? (p as any).type ?? '') as string;
  }

  get canSubmit(): boolean {
    if (this.isLoading || this.loadingLienData || !!this.lienError) return false;
    if (this.lienType === 'DOSSIER') return !!this.form.dossierId && !!this.form.missionId && !!this.selectedPrestataire;
    if (this.lienType === 'AFFAIRE') return !!this.form.affaireId && !!this.selectedPrestataire;
    return false;
  }

  // ── Init ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.dossierService.getAll().subscribe({
      next: (data) => {
        this.dossiers = data ?? [];
        if (this.isEdit && this.form.dossierId) {
          this.onDossierChange(this.form.dossierId);
        }
      },
      error: () => { this.dossiers = []; },
    });

    this.affaireService.getAll().subscribe({
      next: (data) => { this.affaires = data ?? []; },
      error: () => { this.affaires = []; },
    });
  }

  // ── Lien type changed → reset everything ──────────────────────
  onLienTypeChange(): void {
    this.form.dossierId    = null;
    this.form.missionId    = null;
    this.form.affaireId    = null;
    this.form.montant      = null;
    this.missionsForDossier  = [];
    this.selectedPrestataire = null;
    this.lienError           = null;
  }

  // ── DOSSIER selected → auto-fill missions + prestataire ───────
  onDossierChange(dossierId: number | null): void {
    this.missionsForDossier  = [];
    this.selectedPrestataire = null;
    this.lienError           = null;
    this.form.missionId      = null;
    if (!this.isEdit) this.form.montant = null;  // reset montant on dossier change

    if (!dossierId) return;

    this.loadingLienData = true;

    this.missionService.getAll().subscribe({
      next: (missions) => {
        this.missionsForDossier = (missions ?? []).filter(
          m => Number(m.dossierId ?? (m as any).idDossier) === Number(dossierId)
        );

        if (this.missionsForDossier.length === 0) {
          this.lienError       = 'Aucune mission trouvée pour ce dossier.';
          this.loadingLienData = false;
          return;
        }

        const mission = this.missionsForDossier[0];
        this.form.missionId = mission.id ?? null;

        const prestataireId = mission.prestataireId;
        if (!prestataireId) {
          this.lienError       = 'La mission de ce dossier n\'a pas de prestataire assigné.';
          this.loadingLienData = false;
          return;
        }

        this.loadPrestataire(prestataireId);
      },
      error: () => {
        this.lienError       = 'Erreur lors du chargement des missions.';
        this.loadingLienData = false;
      },
    });
  }

  // ── AFFAIRE selected → auto-fill prestataire ──────────────────
  onAffaireChange(affaireId: number | null): void {
    this.selectedPrestataire = null;
    this.lienError           = null;
    if (!this.isEdit) this.form.montant = null;  // reset montant on affaire change

    if (!affaireId) return;

    const affaire = this.affaires.find(a => (a.idAffaire ?? a.id) === Number(affaireId));
    if (!affaire) return;

    const prestataireId = affaire.prestataireId;
    if (!prestataireId) {
      this.lienError = 'Cette affaire n\'a pas de prestataire assigné.';
      return;
    }

    this.loadingLienData = true;
    this.loadPrestataire(prestataireId);
  }

  // ── Shared: load prestataire by id ────────────────────────────
  private loadPrestataire(prestataireId: number): void {
    this.prestataireService.getById(prestataireId).subscribe({
      next: (p: any) => {
        this.selectedPrestataire = { ...p, idPrestataire: p.idPrestataire ?? p.id };
        // Auto-fill montant from prestataire tarif (only on create, not edit)
        if (!this.isEdit && p.tarifJournalier) {
          this.form.montant = Number(p.tarifJournalier);
        }
        this.loadingLienData = false;
      },
      error: () => {
        this.lienError       = 'Impossible de charger le prestataire.';
        this.loadingLienData = false;
      },
    });
  }

  // ── Labels ─────────────────────────────────────────────────────
  getDossierLabel(d: Dossier): string {
    return d.reference ?? `Dossier #${d.idDossier ?? d.id}`;
  }

  getAffaireLabel(a: Affaire): string {
    return a.numeroProcedure
      ? `${a.numeroProcedure} — ${a.tribunal ?? ''}`
      : `Affaire #${a.idAffaire ?? a.id}`;
  }

  getMissionLabel(m: Mission): string {
    return `${this.missionTypeLabels[m.typeMission] ?? m.typeMission} — ${m.statut}`;
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
    if (!this.selectedPrestataire) {
      this.snackBar.open('Aucun prestataire lié.', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const result: Partial<Facture> = {
      numero:       f.numero.trim(),
      montant:      Number(f.montant),
      statut:       this.isEdit ? f.statut : 'EN_ATTENTE_VALIDATION',
      typePaiement: f.typePaiement ?? undefined,
      // Send the relevant link depending on lienType
      dossierId:    this.lienType === 'DOSSIER' && f.dossierId  ? Number(f.dossierId)  : undefined,
      missionId:    this.lienType === 'DOSSIER' && f.missionId  ? Number(f.missionId)  : undefined,
      // For AFFAIRE type, store affaireId as dossierId (backend field) or missionId per your API
      ...(this.lienType === 'AFFAIRE' && f.affaireId
        ? { dossierId: Number(f.affaireId) }
        : {}),
    };

    this.dialogRef.close(result);
  }
}
