import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Mission } from '../../../app/core/models';
import type { TypeMission, StatutMission } from '../../../app/core/models/mission.model';
import { TYPE_MISSION_LABELS, STATUT_MISSION_LABELS } from '../../../app/core/models/mission.model';

interface DialogData {
  isEdit: boolean;
  mission?: Mission;
}

interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-mission-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './mission-form-dialog.html',
  styleUrls: ['./mission-form-dialog.css']
})
export class MissionFormDialogComponent {
  fb = inject(FormBuilder);
  data = inject(MAT_DIALOG_DATA) as DialogData;
  dialogRef = inject(MatDialogRef<MissionFormDialogComponent>);

  form = this.fb.group({
    typeMission: ['', Validators.required],
    dateDebut: ['', Validators.required],
    dateFin: [''],
    statut: ['', Validators.required],
    dossierId: [''],
    prestataireId: [''],
    resultat: ['']
  });

  isLoading = signal<boolean>(false);

  typesMission: Option[] = Object.entries(TYPE_MISSION_LABELS).map(([value, label]) => ({
    value,
    label: label as string
  }));

  statutsMission: Option[] = Object.entries(STATUT_MISSION_LABELS).map(([value, label]) => ({
    value,
    label: label as string
  }));

  constructor() {
    if (this.data.mission) {
      this.form.patchValue({
        typeMission: this.data.mission.typeMission,
        dateDebut: this.data.mission.dateDebut ? this.data.mission.dateDebut.toISOString().split('T')[0] : '',
        dateFin: this.data.mission.dateFin ? this.data.mission.dateFin.toISOString().split('T')[0] : '',
        statut: this.data.mission.statut,
        dossierId: this.data.mission.dossierId ? this.data.mission.dossierId.toString() : '',
        prestataireId: this.data.mission.prestataireId ? this.data.mission.prestataireId.toString() : '',
        resultat: this.data.mission.resultat || ''
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading.set(true);
      setTimeout(() => {
        this.dialogRef.close(this.form.value);
        this.isLoading.set(false);
      }, 1000);
    }
  }
}

