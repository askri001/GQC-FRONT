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

import { Client } from '../../core/models/client.model';

interface DialogData {
  isEdit: boolean;
  client?: Client;
  existingClients: Client[];
}

@Component({
  selector: 'app-client-form-dialog',
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
    MatSnackBarModule
  ],
  templateUrl: './client-form-dialog.html',
  styleUrls: ['./client-form-dialog.css'],
  encapsulation: ViewEncapsulation.None
})
export class ClientFormDialogComponent {

  data = inject<DialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ClientFormDialogComponent>);
  snackBar = inject(MatSnackBar);

  // ================= FORM =================
  form = {
    typeClient: this.data.client?.typeClient ?? 'PHYSIQUE',
    nom: this.data.client?.nom ?? '',
    prenom: this.data.client?.prenom ?? '',
    cin: this.data.client?.cin ?? '',
    rne: this.data.client?.rne ?? '',
    tel: this.data.client?.tel ?? '',
    email: this.data.client?.email ?? '',
    adresse: this.data.client?.adresse ?? ''
  };

  isLoading = false;

  get isEdit(): boolean {
    return !!this.data.client;
  }

  get isPhysical(): boolean {
    return this.form.typeClient === 'PHYSIQUE';
  }

  // ================= SUBMIT =================
  onSubmit(): void {

    if (this.isLoading) return;

    const f = this.form;

    // VALIDATION
    if (!f.nom.trim()) {
      this.snackBar.open('Le nom est requis', 'OK', { duration: 3000 });
      return;
    }
    const telTrimmed = f.tel?.trim();
    if (!telTrimmed || !/^[24579][0-9]{7}$/.test(telTrimmed)) {
      this.snackBar.open('Le numéro de téléphone doit contenir exactement 8 chiffres valides.', 'OK', { duration: 3000 });
      return;
    }
    const emailTrimmed = f.email?.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      this.snackBar.open('Adresse email invalide.', 'OK', { duration: 3000 });
      return;
    }


    // TYPE-SPECIFIC VALIDATION
    if (this.isPhysical) {
      const cinTrimmed = f.cin?.trim();
      if (!cinTrimmed || !/^[0-9]{8}$/.test(cinTrimmed)) {
        this.snackBar.open('La CIN doit contenir exactement 8 chiffres.', 'OK', { duration: 3000 });
        return;
      }
    } else {
      const rneTrimmed = f.rne?.trim();
      if (!rneTrimmed || !/^[0-9]{7}$/.test(rneTrimmed)) {
        this.snackBar.open('Le RNE doit contenir exactement 7 chiffres.', 'OK', { duration: 3000 });
        return;
      }
    }

    const tel = f.tel?.trim();
    const email = f.email?.trim();
    const cin = f.cin?.trim();
    const rne = f.rne?.trim();

    // ================= DUPLICATE CHECK =================
    const others = this.data.existingClients?.filter(c => c.id !== this.data.client?.id) ?? [];
    const duplicateErrors: string[] = [];

    if (tel && others.some(c => c.tel === tel)) {
      duplicateErrors.push('Ce numéro de téléphone est déjà utilisé.');
    }
    if (emailTrimmed && others.some(c => c.email === emailTrimmed)) {
      duplicateErrors.push('Cette adresse email est déjà utilisée.');
    }
    if (cin && others.some(c => c.cin === cin)) {
      duplicateErrors.push('Cette CIN est déjà utilisée.');
    }
    if (rne && others.some(c => c.rne === rne)) {
      duplicateErrors.push('Ce RNE est déjà utilisé.');
    }
    if (duplicateErrors.length > 0) {
      this.snackBar.open(duplicateErrors.join(' | '), 'OK', { duration: 5000 });
      return;
    }

    this.isLoading = true;

    // ================= RESULT =================
    const result: Partial<Client> = {
      typeClient: f.typeClient,
      nom: f.nom.trim(),
      prenom: f.prenom?.trim() || undefined,
      tel: tel,
      email: email || undefined,
      adresse: f.adresse?.trim() || undefined,
      cin: cin || undefined,
      rne: rne || undefined,
      active: this.data.client?.active ?? true
    };

    this.dialogRef.close(result);
  }
}
