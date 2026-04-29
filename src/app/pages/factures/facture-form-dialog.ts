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

import {
  Facture,
  StatutFacture,
  TypeFacture,
  STATUT_FACTURE_LABELS,
  TYPE_FACTURE_LABELS
} from '../../core/models';

export interface FactureFormDialogData {
  facture?: Facture;
  isEdit: boolean;
}

@Component({
  selector: 'app-facture-form-dialog',
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

      <!-- HEADER -->
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.isEdit ? 'edit' : 'add' }}</mat-icon>
          {{ data.isEdit ? 'Modifier la Facture' : 'Nouvelle Facture' }}
        </h2>

        <button mat-icon-button type="button" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- FORM -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <mat-dialog-content class="facture-form">

          <!-- NUMERO -->
          <mat-form-field appearance="outline">
            <mat-label>Numéro</mat-label>
            <input matInput formControlName="numero">
            <mat-icon matSuffix>confirmation_number</mat-icon>
            <mat-error *ngIf="form.get('numero')?.hasError('required')">
              Obligatoire
            </mat-error>
          </mat-form-field>

          <!-- MONTANT -->
          <mat-form-field appearance="outline">
            <mat-label>Montant (DT)</mat-label>
            <input matInput type="number" formControlName="montant">
            <mat-icon matSuffix>attach_money</mat-icon>
          </mat-form-field>

          <!-- TYPE -->
          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select formControlName="typeFacture">

              <mat-option
                *ngFor="let type of typesFacture"
                [value]="type.value">

                {{ type.label }}

              </mat-option>

            </mat-select>
          </mat-form-field>

          <!-- DATE -->
          <mat-form-field appearance="outline">
            <mat-label>Date d'émission</mat-label>

            <input matInput [matDatepicker]="picker" formControlName="dateEmission">

            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <!-- STATUT -->
          <mat-form-field appearance="outline">
            <mat-label>Statut</mat-label>

            <mat-select formControlName="statut">

              <mat-option
                *ngFor="let statut of statutsFacture"
                [value]="statut.value">

                {{ statut.label }}

              </mat-option>

            </mat-select>
          </mat-form-field>

          <!-- MISSION -->
          <mat-form-field appearance="outline">
            <mat-label>ID Mission (optionnel)</mat-label>
            <input matInput type="number" formControlName="missionId">
          </mat-form-field>

        </mat-dialog-content>

        <!-- ACTIONS -->
        <mat-dialog-actions align="end">

          <button mat-button type="button" mat-dialog-close>
            Annuler
          </button>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || isLoading">

            <mat-icon *ngIf="!isLoading">
              {{ data.isEdit ? 'save' : 'add' }}
            </mat-icon>

            <mat-icon *ngIf="isLoading">hourglass_top</mat-icon>

            {{ isLoading ? 'Enregistrement...' : (data.isEdit ? 'Modifier' : 'Créer') }}

          </button>

        </mat-dialog-actions>

      </form>

    </div>
  `,
  styleUrls: ['./facture-form-dialog.css']
})
export class FactureFormDialogComponent implements OnInit {

  form!: FormGroup;
  isLoading = false;

  statutsFacture = Object.entries(STATUT_FACTURE_LABELS).map(([value, label]) => ({
    value: value as StatutFacture,
    label
  }));

  typesFacture = Object.entries(TYPE_FACTURE_LABELS).map(([value, label]) => ({
    value: value as TypeFacture,
    label
  }));

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FactureFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FactureFormDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      numero: [this.data.facture?.numero || '', Validators.required],
      montant: [this.data.facture?.montant || 0, Validators.required],
      typeFacture: [this.data.facture?.typeFacture || 'HONORAIRES', Validators.required],
      dateEmission: [this.data.facture?.dateEmission || new Date(), Validators.required],
      statut: [this.data.facture?.statut || 'EN_ATTENTE', Validators.required],
      missionId: [this.data.facture?.missionId || null]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;

    const facture: Partial<Facture> = {
      ...this.form.value,
      id: this.data.facture?.id
    };

    setTimeout(() => {
      this.dialogRef.close(facture);
      this.isLoading = false;
    }, 500);
  }
}

export {};

