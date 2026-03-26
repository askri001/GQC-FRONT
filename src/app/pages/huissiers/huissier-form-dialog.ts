import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Prestataire, TypePrestataire, PRESTATAIRE_SPECIALITES } from '../../core/models';

export interface HuissierFormDialogData {
  prestataire?: Prestataire;
  isEdit: boolean;
}

@Component({
  selector: 'app-huissier-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data.isEdit ? 'edit' : 'person_add' }}</mat-icon>
          {{ data.isEdit ? 'Modifier Huissier' : 'Nouvel Huissier' }}
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="prestataire-form">
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="nom">
            <mat-error *ngIf="form.get('nom')?.hasError('required')">
              Le nom est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="prenom">
            <mat-error *ngIf="form.get('prenom')?.hasError('required')">
              Le prénom est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="telephone">
            <mat-error *ngIf="form.get('telephone')?.hasError('required')">
              Le téléphone est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
            <mat-error *ngIf="form.get('email')?.hasError('email')">
              Email invalide
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Spécialité</mat-label>
            <mat-select formControlName="specialite">
              @for (spec of specialites; track spec) {
                <mat-option [value]="spec">{{ spec }}</mat-option>
              }
            </mat-select>
            <mat-error *ngIf="form.get('specialite')?.hasError('required')">
              La spécialité est obligatoire
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tarif Journalier (DH)</mat-label>
            <input matInput type="number" formControlName="tarifJournalier">
            <mat-error *ngIf="form.get('tarifJournalier')?.hasError('required')">
              Le tarif est obligatoire
            </mat-error>
            <mat-error *ngIf="form.get('tarifJournalier')?.hasError('min')">
              Le tarif doit être positif
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Adresse</mat-label>
            <input matInput formControlName="adresse">
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
    .dialog-container { min-width: 500px; }
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 0 10px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 20px;
    }
    .dialog-header h2 { display: flex; align-items: center; gap: 10px; margin: 0; color: #1a237e; }
    .prestataire-form { display: flex; flex-direction: column; gap: 16px; }
    .prestataire-form mat-form-field { width: 100%; }
    mat-dialog-actions { padding: 20px 0 0 0; margin-top: 10px; }
    mat-dialog-actions button { margin-left: 10px; }
  `]
})
export class HuissierFormDialogComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  specialites = PRESTATAIRE_SPECIALITES['HUISSIER' as TypePrestataire];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<HuissierFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HuissierFormDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const prestataire = this.data.prestataire;
    
    this.form = this.fb.group({
      nom: [prestataire?.nom || '', Validators.required],
      prenom: [prestataire?.prenom || '', Validators.required],
      telephone: [prestataire?.telephone || '', Validators.required],
      email: [prestataire?.email || '', [Validators.email]],
      specialite: [prestataire?.specialite || '', Validators.required],
      tarifJournalier: [prestataire?.tarifJournalier || null, [Validators.required, Validators.min(0)]],
      adresse: [prestataire?.adresse || ''],
      actif: [prestataire?.actif !== undefined ? prestataire.actif : true]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      
      const formValue = this.form.value;
      const prestataireData: Partial<Prestataire> = {
        ...formValue,
        typePrestataire: 'HUISSIER' as TypePrestataire
      };

      // Simulate save
      setTimeout(() => {
        this.dialogRef.close({
          ...prestataireData,
          id: this.data.prestataire?.id
        });
        this.isLoading = false;
      }, 800);
    }
  }
}

