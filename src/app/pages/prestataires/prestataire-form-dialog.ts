import { Component, inject, ViewEncapsulation, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Prestataire, TypePrestataire, PRESTATAIRE_SPECIALITES } from '../../core/models/prestataire.model';

interface DialogData {
  isEdit: boolean;
  prestataire?: Prestataire;
  existingPrestataires: Prestataire[];
  defaultType?: TypePrestataire;
}

@Component({
  selector: 'app-prestataire-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './prestataire-form-dialog.html',
  styleUrls: ['./prestataire-form-dialog.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PrestataireFormDialogComponent implements OnInit {

  data      = inject<DialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<PrestataireFormDialogComponent>);
  snackBar  = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  isLoading = signal(false);

  get isEdit(): boolean {
    return !!this.data.prestataire;
  }

  // ── Specialités dynamiques selon le type ─────────────────────────────────
  getSpecialites(): string[] {
    const type = this.form?.get('typePrestataire')?.value as TypePrestataire;
    return PRESTATAIRE_SPECIALITES[type] ?? [];
  }

  onTypeChange(): void {
    this.form.get('specialite')?.setValue('');
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const p = this.data.prestataire;

    this.form = this.fb.group({
      typePrestataire: [
        (p?.typePrestataire ?? this.data.defaultType ?? 'AVOCAT') as TypePrestataire,
        Validators.required,
      ],
      nom:             [p?.nom             ?? '', Validators.required],
      prenom:          [p?.prenom          ?? '', Validators.required],
      telephone:       [p?.telephone       ?? '', Validators.required],
      email:           [p?.email           ?? '', [Validators.required, Validators.email]],
      adresse:         [p?.adresse         ?? '', Validators.required],
      specialite:      [p?.specialite      ?? '', Validators.required],
      tarifJournalier: [p?.tarifJournalier ?? 0,  [Validators.required, Validators.min(0.01)]],
      // actif is always a real boolean — never null, never string
      actif:           [p?.actif ?? true],
      rib:             [p?.rib ?? '', [Validators.pattern(/^(\d{20})?$/)]]
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isLoading() || this.form.invalid) return;

    const raw = this.form.getRawValue();

    // ── Validation ────────────────────────────────────────────────────────
    const telTrimmed = (raw.telephone ?? '').trim();
    if (!/^[24579][0-9]{7}$/.test(telTrimmed)) {
      this.snackBar.open(
        'Le numéro de téléphone doit contenir exactement 8 chiffres valides.',
        'OK', { duration: 3000 });
      return;
    }

    const emailTrimmed = (raw.email ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      this.snackBar.open('Adresse email invalide.', 'OK', { duration: 3000 });
      return;
    }

    // ── Duplicate check ───────────────────────────────────────────────────
    const others = (this.data.existingPrestataires ?? [])
      .filter(p => p.idPrestataire !== this.data.prestataire?.idPrestataire);

    const duplicates: string[] = [];
    if (others.some(p => p.telephone === telTrimmed))
      duplicates.push('Ce numéro de téléphone est déjà utilisé.');
    if (others.some(p => p.email === emailTrimmed))
      duplicates.push('Cette adresse email est déjà utilisée.');

    if (duplicates.length) {
      this.snackBar.open(duplicates.join(' | '), 'OK', { duration: 5000 });
      return;
    }

    this.isLoading.set(true);

    // ── Build payload — actif is always a strict boolean ──────────────────
    const payload: Partial<Prestataire> = {
      type:            raw.typePrestataire,  // backend DTO field is "type", not "typePrestataire"
      typePrestataire: raw.typePrestataire,  // keep for Angular model compatibility
      nom:             raw.nom.trim(),
      prenom:          raw.prenom.trim(),
      telephone:       telTrimmed,
      email:           emailTrimmed,
      adresse:         raw.adresse.trim(),
      specialite:      raw.specialite,
      tarifJournalier: Number(raw.tarifJournalier),
      actif:           raw.actif === true || raw.actif === 'true',
      rib:             raw.rib?.trim() || undefined,
    };

    // Debug — remove after confirming fix
    // console.log('ACTIF:', payload.actif, typeof payload.actif);

    this.dialogRef.close(payload);
  }
}
