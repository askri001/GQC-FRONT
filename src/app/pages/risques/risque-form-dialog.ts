import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { RisqueService } from '../../core/services/risque.service';
import { Risque } from '../../core/models';

export interface DialogData {
  risque: Risque | null;
}

@Component({
  selector: 'app-risque-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ data.risque ? 'Modifier Risque' : 'Nouveau Risque' }}</h2>
      <mat-dialog-content>
        <form [formGroup]="form" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Montant Principal</mat-label>
            <input matInput type="number" formControlName="montantPrincipal">
            <mat-error *ngIf="form.get('montantPrincipal')?.hasError('required')">Requis</mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Intérêts</mat-label>
            <input matInput type="number" formControlName="montantInteret">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Montant Total</mat-label>
            <input matInput type="number" formControlName="montantTotal">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Taux d'intérêt (%)</mat-label>
            <input matInput type="number" step="0.1" formControlName="tauxInteret">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Date Contrat</mat-label>
            <input matInput [matDatepicker]="dateContratPicker" formControlName="dateContrat">
            <mat-datepicker-toggle matSuffix [for]="dateContratPicker"></mat-datepicker-toggle>
            <mat-datepicker #dateContratPicker></mat-datepicker>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Date Échéance</mat-label>
            <input matInput [matDatepicker]="dateEcheancePicker" formControlName="dateEcheance">
            <mat-datepicker-toggle matSuffix [for]="dateEcheancePicker"></mat-datepicker-toggle>
            <mat-datepicker #dateEcheancePicker></mat-datepicker>
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>ID Dossier</mat-label>
            <input matInput type="number" formControlName="dossierId">
          </mat-form-field>
          
          <mat-form-field appearance="outline">
            <mat-label>Actif</mat-label>
            <mat-select formControlName="actif">
              <mat-option [value]="true">Oui</mat-option>
              <mat-option [value]="false">Non</mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Annuler</button>
        <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
          {{ data.risque ? 'Modifier' : 'Créer' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./risque-form-dialog.css']
})
export class RisqueFormDialogComponent {
  form: FormGroup;
  saving = signal(false);

  constructor(
    public dialogRef: MatDialogRef<RisqueFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private risqueService: RisqueService
  ) {
    const risque = this.data.risque || {} as Risque;
    this.form = this.fb.group({
      montantPrincipal: [risque.montantPrincipal || null, Validators.required],
      montantInteret: [risque.montantInteret || 0],
      montantTotal: [risque.montantTotal || 0],
      dateContrat: [risque.dateContrat || null],
      dateEcheance: [risque.dateEcheance || null],
      tauxInteret: [risque.tauxInteret || 0],
      dossierId: [risque.dossierId || null, Validators.required],
      actif: [risque.actif !== false] // default true
    });
  }

  save(): void {
    if (this.form.valid) {
      this.saving.set(true);
      const risqueData = { ...this.form.value };
      
      const action$ = this.data.risque 
        ? this.risqueService.update(this.data.risque.id!, risqueData)
        : this.risqueService.create(risqueData);

      action$.subscribe({
        next: (risque) => {
          this.saving.set(false);
          this.dialogRef.close(risque);
        },
        error: (err) => {
          console.error('Save error:', err);
          this.saving.set(false);
        }
      });
    }
  }
}


