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
    if (!f.nom.trim() || !f.tel.trim()) {
      this.snackBar.open('Nom et téléphone sont requis', 'OK', { duration: 3000 });
      return;
    }

    // TYPE-SPECIFIC VALIDATION
    if (this.isPhysical) {
      if (!f.cin?.trim()) {
        this.snackBar.open('CIN requis pour Particulier', 'OK', { duration: 3000 });
        return;
      }
      if (!/^[0-9]+$/.test(f.cin.trim())) {
        this.snackBar.open('CIN doit être numérique', 'OK', { duration: 3000 });
        return;
      }
    } else {
      if (!f.rne?.trim()) {
        this.snackBar.open('RNE requis pour Société', 'OK', { duration: 3000 });
        return;
      }
    }

    const tel = f.tel?.trim();
    const email = f.email?.trim();
    const cin = f.cin?.trim();
    const rne = f.rne?.trim();

    // ================= DUPLICATE CHECK =================
    const duplicate = this.data.existingClients?.find(c =>
      c.id !== this.data.client?.id &&
      (
        (tel && c.tel === tel) ||
        (email && c.email === email) ||
        (cin && c.cin === cin) ||
        (rne && c.rne === rne)
      )
    );

    if (duplicate) {
      this.snackBar.open('Client déjà existant (tel/email/cin/rne)', 'OK', {
        duration: 3000
      });
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
