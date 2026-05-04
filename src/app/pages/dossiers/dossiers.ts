import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DossierService } from '../../core/services/dossier.service';
import { ApiService } from '../../core/services/api.service';
import type { Dossier } from '../../core/models/dossier.model';
import { DOSSIER_STATUT_LABELS, NIVEAU_RISQUE_LABELS } from '../../core/models/dossier.model';
import { Client } from '../../core/models/client.model';

@Component({
  selector: 'app-dossiers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: "./dossiers.html",
  styleUrls: ["./dossiers-modern.css", "./dossiers.css"]
})
export class DossiersComponent implements OnInit {
  private dossierService = inject(DossierService);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  dossiers = signal<Dossier[]>([]);
  clients = signal<Client[]>([]);
  displayedColumns: string[] = ['reference', 'dateOuverture', 'statut', 'niveauRisque', 'montantInitial', 'montantRecupere', 'actions'];

  
  searchTerm = '';
  statutFilter = '';
  pageSize = 10;
  currentPage = 0;

  
  loading = signal(false);

  
  editId = signal<number | null>(null);
  editMode = signal(false);
  tempDossier = signal<Partial<Dossier> | null>(null);
  selectedClientId = signal<number>(0);

  
  get filteredDossiers() {
    let result = this.dossiers();
    if (this.searchTerm) {
      result = result.filter(d => 
        d.reference.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    if (this.statutFilter) {
      result = result.filter(d => d.statut === this.statutFilter);
    }
    const start = this.currentPage * this.pageSize;
    return result.slice(start, start + this.pageSize);
  }

  get totalDossiers() {
    return this.dossiers().length;
  }

  ngOnInit() {
    this.loadDossiers();
    this.loadClients();
  }

  loadClients() {
    this.api.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients', err)
    });
  }

  loadDossiers() {
    this.loading.set(true);
    this.dossierService.getAll().subscribe({
      next: (data) => {
        this.dossiers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dossiers', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement dossiers', 'error');
      }
    });
  }

  createDossier() {
    this.editId.set(0);
    this.tempDossier.set({
      reference: '',
      dateOuverture: new Date(),
      statut: 'EN_COURS',
      niveauRisque: 'FAIBLE',
      montantInitial: 0,
      montantRecupere: 0,
      clientId: 0 
    });
    this.selectedClientId.set(0);
    this.editMode.set(true);
  }

  editDossier(dossier: Dossier) {
    this.editId.set(dossier.idDossier!);
    this.tempDossier.set({ ...dossier });
    this.selectedClientId.set(dossier.clientId);
    this.editMode.set(true);
  }

  saveDossier() {
    const temp = this.tempDossier();
    if (!temp) return;

    temp.clientId = this.selectedClientId();

    if (!temp.reference || temp.montantInitial === undefined || temp.clientId === 0) {
      this.showNotification('Référence, montant initial et client requis', 'error');
      return;
    }

    const request = this.editId() === 0 
      ? this.dossierService.create(temp as Omit<Dossier, 'idDossier'>)
      : this.dossierService.update(this.editId()!, temp as Dossier);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadDossiers();
        this.cancelEdit();
        this.showNotification('Dossier sauvegardé avec coordonnées', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  deleteDossier(id: number) {
    if (confirm('Confirmer la suppression ?')) {
      this.dossierService.delete(id).subscribe({
        next: () => {
          this.loadDossiers();
          this.showNotification('Dossier supprimé', 'success');
        },
        error: (err) => {
          console.error('Delete error', err);
          this.showNotification('Erreur suppression', 'error');
        }
      });
    }
  }

  cancelEdit() {
    this.editId.set(null);
    this.tempDossier.set(null);
    this.editMode.set(false);
    this.selectedClientId.set(0);
  }

  applyFilters() {
    this.currentPage = 0; 
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  getStatutClass(statut: string): string {
    return `status-chip status-${statut.toLowerCase().replace('_', '-')}`;
  }

  getRisqueClass(risque: string): string {
    return `risk-chip risk-${risque.toLowerCase()}`;
  }

  getStatutLabel(statut: string): string {
    return DOSSIER_STATUT_LABELS[statut as keyof typeof DOSSIER_STATUT_LABELS] || statut;
  }

  getRisqueLabel(risque: string): string {
    return NIVEAU_RISQUE_LABELS[risque as keyof typeof NIVEAU_RISQUE_LABELS] || risque;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }

  getClientLabel(client: Client): string {
    return `${client.nom}${client.prenom ? ' ' + client.prenom : ''} ${client.cin ? '(' + client.cin + ')' : ''}`.trim();
  }
}

