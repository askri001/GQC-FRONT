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
import { Facture, StatutFacture, TypeFacture, STATUT_FACTURE_LABELS, TYPE_FACTURE_LABELS } from '../../core/models';

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
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.isEdit ? 'edit' : 'add' }}</mat-icon>
          {{ data.isEdit ? 'Modifier la Facture' : 'Nouvelle Facture' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="facture-form">
          <mat-form-field appearance="outline">
            <mat-label>Numéro Facture</mat-label>
            <input matInput formControlName="numero" placeholder="FAC-2024-XXX">
            <mat-icon matSuffix>tag</mat-icon>
            <mat-error *ngIf="form.get('numero')?.hasError('required')">
              Le numéro est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date d'Émission</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="dateEmission">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('dateEmission')?.hasError('required')">
              La date est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Montant (DT)</mat-label>
            <input matInput type="number" formControlName="montant" placeholder="0">
            <mat-icon matSuffix>attach_money</mat-icon>
            <mat-error *ngIf="form.get('montant')?.hasError('required')">
              Le montant est obligatoire
            </mat-error>
            <mat-error *ngIf="form.get('montant')?.hasError('min')">
              Le montant doit être positif
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Type de Facture</mat-label>
            <mat-select formControlName="typeFacture">
              @for (type of typesFacture; track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>category</mat-icon>
            <mat-error *ngIf="form.get('typeFacture')?.hasError('required')">
              Le type est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="statut">
              @for (statut of statutsFacture; track statut.value) {
                <mat-option [value]="statut.value">{{ statut.label }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>flag</mat-icon>
            <mat-error *ngIf="form.get('statut')?.hasError('required')">
              Le statut est obligatoire
            </mat-error>
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
      min-width: 450px;
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
      color: #1a237e;
    }

    .dialog-header h2 mat-icon {
      color: #1a237e;
    }

    .facture-form {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .facture-form mat-form-field {
      width: 100%;
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
export class FactureFormDialogComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;

  statutsFacture: { value: StatutFacture; label: string }[] = [
    { value: 'EN_ATTENTE', label: STATUT_FACTURE_LABELS['EN_ATTENTE'] },
    { value: 'VALIDEE', label: STATUT_FACTURE_LABELS['VALIDEE'] },
    { value: 'PAYEE', label: STATUT_FACTURE_LABELS['PAYEE'] },
    { value: 'REJETEE', label: STATUT_FACTURE_LABELS['REJETEE'] }
  ];

  typesFacture: { value: TypeFacture; label: string }[] = [
    { value: 'HONORAIRES', label: TYPE_FACTURE_LABELS['HONORAIRES'] },
    { value: 'FRAIS', label: TYPE_FACTURE_LABELS['FRAIS'] },
    { value: 'EXPERTISE', label: TYPE_FACTURE_LABELS['EXPERTISE'] },
    { value: 'AUTRE', label: TYPE_FACTURE_LABELS['AUTRE'] }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FactureFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FactureFormDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const facture = this.data.facture;
    
    this.form = this.fb.group({
      numero: [facture?.numero || '', [Validators.required, Validators.pattern(/^FAC-\d{4}-\d{3}$/)]],
      dateEmission: [facture?.dateEmission ? new Date(facture.dateEmission) : new Date(), Validators.required],
      montant: [facture?.montant || null, [Validators.required, Validators.min(0)]],
      typeFacture: [facture?.typeFacture || 'HONORAIRES', Validators.required],
      statut: [facture?.statut || 'EN_ATTENTE', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      
      const formValue = this.form.value;
      const factureData: Partial<Facture> = {
        numero: formValue.numero,
        dateEmission: formValue.dateEmission,
        montant: formValue.montant,
        typeFacture: formValue.typeFacture,
        statut: formValue.statut
      };

      // Simulate network delay for better UX
      setTimeout(() => {
        this.dialogRef.close({
          ...factureData,
          id: this.data.facture?.id
        });
      }, 500);
    }
  }
}

