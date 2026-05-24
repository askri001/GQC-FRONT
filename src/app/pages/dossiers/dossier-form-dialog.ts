import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../core/services/api.service';
import { Client } from '../../core/models/client.model';
import { Dossier } from '../../core/models/dossier.model';

export interface DossierFormDialogData {
  isEdit: boolean;
  dossier?: Partial<Dossier>;
}

@Component({
  selector: 'app-dossier-form-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatSnackBarModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './dossier-form-dialog.html',
  styleUrls: ['./dossier-form-dialog.css']
})
export class DossierFormDialogComponent implements OnInit {
  data      = inject<DossierFormDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<DossierFormDialogComponent>);
  snackBar  = inject(MatSnackBar);
  private api = inject(ApiService);

  clients: Client[] = [];

  form = {
    clientId:     this.data.dossier?.clientId     ?? 0,
    reference:    this.data.dossier?.reference    ?? '',
    dateOuverture: this.data.dossier?.dateOuverture ?? new Date(),
    statut:       this.data.dossier?.statut       ?? 'EN_COURS',
    niveauRisque: this.data.dossier?.niveauRisque ?? 'FAIBLE',
  };

  get dialogTitle(): string { return this.data.isEdit ? 'Modifier Dossier' : 'Nouveau Dossier'; }
  get dialogSubtitle(): string { return this.data.isEdit ? 'Modifiez les informations du dossier' : 'Créez un nouveau dossier contentieux'; }
  get saveLabel(): string { return this.data.isEdit ? 'Sauvegarder' : 'Créer'; }

  ngOnInit(): void {
    this.api.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients = data ?? [],
      error: () => {}
    });
  }

  getClientLabel(c: Client): string {
    return `${c.nom}${c.prenom ? ' ' + c.prenom : ''}${c.cin ? ' (' + c.cin + ')' : ''}`.trim();
  }

  onSubmit(): void {
    if (!this.form.reference?.trim()) {
      this.snackBar.open('La référence est requise', 'OK', { duration: 3000 }); return;
    }
    if (!this.form.clientId) {
      this.snackBar.open('Veuillez sélectionner un client', 'OK', { duration: 3000 }); return;
    }
    this.dialogRef.close(this.form);
  }
}
