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
  Mission,
  StatutMission,
  TypeMission,
  STATUT_MISSION_LABELS,
  TYPE_MISSION_LABELS,
} from '../../core/models';

export interface MissionFormDialogData {
  isEdit: boolean;
  mission?: Mission;
}

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
  ],
  templateUrl: './mission-form-dialog.html',
  styleUrls: ['./mission-form-dialog.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MissionFormDialogComponent {

  data      = inject<MissionFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<MissionFormDialogComponent>);
  snackBar  = inject(MatSnackBar);

  // ── Lookup data ────────────────────────────────────────────────
  statuts: StatutMission[] = ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  types: TypeMission[]     = ['HUISSIER', 'EXPERT', 'AVOCAT'];

  statutLabels = STATUT_MISSION_LABELS as Record<StatutMission, string>;
  typeLabels   = TYPE_MISSION_LABELS   as Record<TypeMission, string>;

  // ── Form model ─────────────────────────────────────────────────
  form = {
    typeMission:  this.data.mission?.typeMission  ?? 'HUISSIER' as TypeMission,
    statut:       this.data.mission?.statut       ?? 'EN_ATTENTE' as StatutMission,
    dateDebut:    this.toDateString(this.data.mission?.dateDebut) ?? this.toDateString(new Date())!,
    dateFin:      this.toDateString(this.data.mission?.dateFin)  ?? '',
    dossierId:    this.data.mission?.affaireId    ?? null as number | null,
    prestataireId: this.data.mission?.prestataireId ?? null as number | null,
    resultat:     this.data.mission?.resultat     ?? '',
  };

  isLoading = false;

  get isEdit(): boolean { return !!this.data.mission; }

  // ── Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isLoading) return;

    const f = this.form;

    // Validation
    if (!f.typeMission) {
      this.snackBar.open('Le type de mission est requis.', 'OK', { duration: 3000 });
      return;
    }
    if (!f.dateDebut) {
      this.snackBar.open('La date de début est requise.', 'OK', { duration: 3000 });
      return;
    }
    if (!f.statut) {
      this.snackBar.open('Le statut est requis.', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const result: Partial<Mission> = {
      typeMission:   f.typeMission,
      statut:        f.statut,
      dateDebut:     new Date(f.dateDebut),
      dateFin:       f.dateFin ? new Date(f.dateFin) : undefined,
      affaireId:     f.dossierId    ? Number(f.dossierId)    : undefined,
      prestataireId: f.prestataireId ? Number(f.prestataireId) : undefined,
      resultat:      f.resultat?.trim() || undefined,
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
