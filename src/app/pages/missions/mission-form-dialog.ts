import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Mission, StatutMission, TypeMission, STATUT_MISSION_LABELS, TYPE_MISSION_LABELS } from '../../core/models';

export interface MissionFormDialogData {
  mission?: Mission;
  isEdit: boolean;
}

@Component({
  selector: 'app-mission-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.isEdit ? 'edit' : 'add' }}</mat-icon>
          {{ data.isEdit ? 'Modifier la Mission' : 'Nouvelle Mission' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="mission-form">
          <mat-form-field appearance="outline">
            <mat-label>Type de Mission</mat-label>
            <mat-select formControlName="typeMission">
              @for (type of typesMission; track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>category</mat-icon>
            <mat-error *ngIf="form.get('typeMission')?.hasError('required')">
              Le type est obligatoire
            </mat-error>
          </mat-form-field>

          <div class="date-row">
            <mat-form-field appearance="outline">
              <mat-label>Date Début</mat-label>
              <input matInput [matDatepicker]="pickerDebut" formControlName="dateDebut">
              <mat-datepicker-toggle matSuffix [for]="pickerDebut"></mat-datepicker-toggle>
              <mat-datepicker #pickerDebut></mat-datepicker>
              <mat-error *ngIf="form.get('dateDebut')?.hasError('required')">
                La date de début est obligatoire
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date Fin</mat-label>
              <input matInput [matDatepicker]="pickerFin" formControlName="dateFin">
              <mat-datepicker-toggle matSuffix [for]="pickerFin"></mat-datepicker-toggle>
              <mat-datepicker #pickerFin></mat-datepicker>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="statut">
              @for (statut of statutsMission; track statut.value) {
                <mat-option [value]="statut.value">{{ statut.label }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>flag</mat-icon>
            <mat-error *ngIf="form.get('statut')?.hasError('required')">
              Le statut est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>ID Dossier</mat-label>
            <input matInput type="number" formControlName="dossierId" placeholder="1">
            <mat-icon matSuffix>folder</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>ID Prestataire</mat-label>
            <input matInput type="number" formControlName="prestataireId" placeholder="1">
            <mat-icon matSuffix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Résultat</mat-label>
            <textarea matInput formControlName="resultat" placeholder="Résultat de la mission..." rows="3"></textarea>
            <mat-icon matSuffix>description</mat-icon>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Annuler</button>
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="form.invalid || isLoading"
          (click)="onSubmit()"
        >
          <mat-icon>{{ data.isEdit ? 'save' : 'add' }}</mat-icon>
          {{ isLoading ? 'Enregistrement...' : (data.isEdit ? 'Mettre à jour' : 'Créer') }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      min-width: 500px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 10px 0;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 20px;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      color: #2e7d32;
    }

    .dialog-header h2 mat-icon {
      color: #2e7d32;
    }

    .mission-form {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .mission-form mat-form-field {
      width: 100%;
    }

    .date-row {
      display: flex;
      gap: 16px;
    }

    .date-row mat-form-field {
      flex: 1;
    }

    mat-dialog-actions {
      padding: 20px 0 0 0;
      margin-top: 10px;
    }

    mat-dialog-actions button {
      margin-left: 10px;
    }
  `]
})
export class MissionFormDialogComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;

  statutsMission: { value: StatutMission; label: string }[] = [
    { value: 'EN_ATTENTE', label: STATUT_MISSION_LABELS['EN_ATTENTE'] },
    { value: 'EN_COURS', label: STATUT_MISSION_LABELS['EN_COURS'] },
    { value: 'TERMINEE', label: STATUT_MISSION_LABELS['TERMINEE'] },
    { value: 'ANNULEE', label: STATUT_MISSION_LABELS['ANNULEE'] }
  ];

  typesMission: { value: TypeMission; label: string }[] = [
    { value: 'HUISSIER', label: TYPE_MISSION_LABELS['HUISSIER'] },
    { value: 'EXPERT', label: TYPE_MISSION_LABELS['EXPERT'] },
    { value: 'AVOCAT', label: TYPE_MISSION_LABELS['AVOCAT'] }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MissionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MissionFormDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const mission = this.data.mission;
    
    this.form = this.fb.group({
      typeMission: [mission?.typeMission || 'SIGNIFICATION', Validators.required],
      dateDebut: [mission?.dateDebut ? new Date(mission.dateDebut) : new Date(), Validators.required],
      dateFin: [mission?.dateFin ? new Date(mission.dateFin) : null],
      statut: [mission?.statut || 'EN_ATTENTE', Validators.required],
      dossierId: [mission?.dossierId || null],
      prestataireId: [mission?.prestataireId || null],
      resultat: [mission?.resultat || '']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      
      const formValue = this.form.value;
      const missionData: Partial<Mission> = {
        typeMission: formValue.typeMission,
        dateDebut: formValue.dateDebut,
        dateFin: formValue.dateFin,
        statut: formValue.statut,
        dossierId: formValue.dossierId,
        prestataireId: formValue.prestataireId,
        resultat: formValue.resultat
      };

      setTimeout(() => {
        this.dialogRef.close({
          ...missionData,
          id: this.data.mission?.id
        });
      }, 500);
    }
  }
}

