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
  Mission,
  StatutMission,
  TypeMission,
  STATUT_MISSION_LABELS,
  TYPE_MISSION_LABELS,
} from '../../core/models';

import { ApiService } from '../../core/services/api.service';
import { PrestataireService } from '../../core/services/prestataire.service';
import { MissionService } from '../../core/services/mission.service';
import { AffaireService } from '../../core/services/affaire.service';
import { Prestataire } from '../../core/models/prestataire.model';
import { Affaire } from '../../core/models/affaire.model';

export interface MissionFormDialogData {
  isEdit: boolean;
  mission?: Mission;
}

// Map TypeMission → TypePrestataire for filtering (AVOCAT removed)
const MISSION_TO_PRESTATAIRE_TYPE: Record<string, string> = {
  HUISSIER: 'HUISSIER',
  EXPERT:   'EXPERT',
};

type FactureLienType = 'MISSION' | 'AFFAIRE';

@Component({
  selector: 'app-mission-form-dialog',
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
  templateUrl: './mission-form-dialog.html',
  styleUrls: ['./mission-form-dialog.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MissionFormDialogComponent implements OnInit {

  data      = inject<MissionFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<MissionFormDialogComponent>);
  snackBar  = inject(MatSnackBar);
  private api               = inject(ApiService);
  private prestataireService = inject(PrestataireService);
  private missionService    = inject(MissionService);
  private affaireService    = inject(AffaireService);

  // ── Lookup data ────────────────────────────────────────────────
  types: TypeMission[] = ['HUISSIER', 'EXPERT'];
  typeLabels   = TYPE_MISSION_LABELS   as Record<TypeMission, string>;
  statutLabels = STATUT_MISSION_LABELS as Record<StatutMission, string>;

  dossiers: any[]          = [];
  prestataires: Prestataire[] = [];
  termineesMissions: Mission[] = [];
  termineesAffaires: Affaire[] = [];

  // ── typeFacture controls which linked-entity dropdown is shown ─
  typeFacture: FactureLienType = 'MISSION';
  linkedMissionId: number | null = null;
  linkedAffaireId: number | null = null;

  // ── Form model (dates removed) ─────────────────────────────────
  form = {
    typeMission:   this.data.mission?.typeMission   ?? 'HUISSIER' as TypeMission,
    dossierId:     this.data.mission?.dossierId     ?? null as number | null,
    prestataireId: this.data.mission?.prestataireId ?? null as number | null,
    commentaire:   this.data.mission?.commentaire   ?? '',
    resultat:      this.data.mission?.resultat      ?? '',
    statut:        this.data.mission?.statut        ?? 'EN_ATTENTE' as StatutMission,
  };

  isLoading = false;

  get isEdit(): boolean { return !!this.data.mission; }

  // ── Available statuts based on current status (workflow) ───────
  get availableStatuts(): StatutMission[] {
    if (!this.isEdit) return ['EN_ATTENTE'];
    const current = this.data.mission?.statut;
    switch (current) {
      case 'EN_ATTENTE': return ['EN_ATTENTE', 'EN_COURS', 'ANNULEE'];
      case 'EN_COURS':   return ['EN_COURS', 'TERMINEE', 'ANNULEE'];
      case 'TERMINEE':   return ['TERMINEE'];
      case 'ANNULEE':    return ['ANNULEE'];
      default:           return ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
    }
  }

  // résultat required only when transitioning to TERMINEE
  get resultatRequired(): boolean {
    return this.isEdit && this.form.statut === 'TERMINEE';
  }

  // ── Init ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDossiers();
    this.loadPrestatairesForType(this.form.typeMission);
    this.loadTermineesMissions();
    this.loadTermineesAffaires();
  }

  // ── Load dossiers ──────────────────────────────────────────────
  loadDossiers(): void {
    this.api.get<any[]>('/dossiers').subscribe({
      next: (data) => this.dossiers = data ?? [],
      error: () => this.dossiers = [],
    });
  }

  getDossierLabel(d: any): string {
    const ref = d.reference ?? d.ref ?? '';
    return ref ? `${ref}` : `Dossier #${d.idDossier ?? d.id}`;
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
    return `Mission #${m.id} — ${m.typeMission}${m.affaireId ? ' (Affaire ' + m.affaireId + ')' : ''}`;
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

  // ── On typeFacture change → reset linked selection ─────────────
  onTypeFactureChange(): void {
    this.linkedMissionId = null;
    this.linkedAffaireId = null;
  }

  // ── Load prestataires filtered by type ────────────────────────
  loadPrestatairesForType(type: TypeMission): void {
    const prestType = MISSION_TO_PRESTATAIRE_TYPE[type];
    this.prestataireService.getByType(prestType as any).subscribe({
      next: (data) => {
        this.prestataires = (data ?? []).map((p: any) => ({
          ...p,
          idPrestataire: p.idPrestataire ?? p.id,
        })).filter((p: any) => p.actif !== false);
        if (this.form.prestataireId &&
            !this.prestataires.some(p => p.idPrestataire === this.form.prestataireId)) {
          this.form.prestataireId = null;
        }
      },
      error: () => this.prestataires = [],
    });
  }

  onTypeChange(): void {
    this.form.prestataireId = null;
    this.loadPrestatairesForType(this.form.typeMission);
  }

  getPrestataireLabel(p: Prestataire): string {
    return `${p.prenom} ${p.nom} (${p.specialite ?? ''})`;
  }

  // ── Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isLoading) return;

    const f = this.form;

    if (!f.typeMission) {
      this.snackBar.open('Le type de mission est requis.', 'OK', { duration: 3000 });
      return;
    }
    if (this.resultatRequired && !f.resultat?.trim()) {
      this.snackBar.open('Le résultat est requis pour clôturer une mission.', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const result: Partial<Mission> = {
      typeMission:   f.typeMission,
      statut:        f.statut,
      dossierId:     f.dossierId     ? Number(f.dossierId)     : undefined,
      prestataireId: f.prestataireId ? Number(f.prestataireId) : undefined,
      commentaire:   f.commentaire?.trim() || undefined,
      resultat:      f.resultat?.trim() || undefined,
      // linked entity from typeFacture selection
      affaireId:     this.typeFacture === 'AFFAIRE' && this.linkedAffaireId
                       ? Number(this.linkedAffaireId) : undefined,
    };

    this.dialogRef.close(result);
  }
}
