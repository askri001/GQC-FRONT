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

import { PrestataireService } from '../../core/services/prestataire.service';
import { DossierService } from '../../core/services/dossier.service';
import { Prestataire } from '../../core/models/prestataire.model';
import { Dossier } from '../../core/models/dossier.model';

export interface MissionFormDialogData {
  isEdit: boolean;
  mission?: Mission;
}

// Map TypeMission → TypePrestataire for filtering
const MISSION_TO_PRESTATAIRE_TYPE: Record<string, string> = {
  EXECUTION: 'HUISSIER',
  EXPERTISE: 'EXPERT',
};

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
  private prestataireService = inject(PrestataireService);
  private dossierService     = inject(DossierService);

  // ── Lookup data ────────────────────────────────────────────────
  types: TypeMission[] = ['EXECUTION', 'EXPERTISE'];
  typeLabels   = TYPE_MISSION_LABELS   as Record<TypeMission, string>;
  statutLabels = STATUT_MISSION_LABELS as Record<StatutMission, string>;

  dossiers:     Dossier[]     = [];
  prestataires: Prestataire[] = [];

  // ── Form model ─────────────────────────────────────────────────
  form = {
    typeMission:   this.data.mission?.typeMission   ?? 'EXECUTION' as TypeMission,
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

  // commentaire toujours obligatoire
  get commentaireRequired(): boolean { return true; }

  // ── Init ───────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDossiers();
    this.loadPrestatairesForType(this.form.typeMission);
  }

  // ── Load dossiers ──────────────────────────────────────────────
  loadDossiers(): void {
    this.dossierService.getAll().subscribe({
      next: (data) => this.dossiers = data ?? [],
      error: () => this.dossiers = [],
    });
  }

  getDossierLabel(d: Dossier): string {
    return d.reference ?? `Dossier #${d.idDossier ?? d.id}`;
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
    return `${p.prenom} ${p.nom}`;
  }

  // ── Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isLoading) return;

    const f = this.form;

    if (!f.typeMission) {
      this.snackBar.open('Le type de mission est requis.', 'OK', { duration: 3000 });
      return;
    }
    if (!f.dossierId) {
      this.snackBar.open('Le dossier est requis.', 'OK', { duration: 3000 });
      return;
    }
    // Commentaire STRICTEMENT obligatoire
    if (!f.commentaire?.trim()) {
      this.snackBar.open('Le commentaire est obligatoire.', 'OK', { duration: 3000 });
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
      dossierId:     Number(f.dossierId),
      prestataireId: f.prestataireId ? Number(f.prestataireId) : undefined,
      // Toujours envoyer le commentaire — jamais undefined pour ne pas l'écraser
      commentaire:   f.commentaire.trim(),
      resultat:      f.resultat?.trim() || undefined,
    };

    this.dialogRef.close(result);
  }
}
