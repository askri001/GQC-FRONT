import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  Facture,
  StatutFacture,
  TypeFacture,
  STATUT_FACTURE_LABELS,
  TYPE_FACTURE_LABELS
} from '../../core/models';

import { FactureService } from '../../core/services/facture.service';
import { FactureFormDialogComponent } from './facture-form-dialog';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './facture.html',
  styleUrls: ['./facture-modern.css']
})
export class FacturesComponent implements OnInit {

  private factureService = inject(FactureService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // ================= DATA =================
  factures = signal<Facture[]>([]);
  filteredFactures = signal<Facture[]>([]);
  isLoading = signal(false);

  // ================= FILTERS =================
  searchQuery = '';
  statusFilter = '';
  typeFilter = '';

  // ================= PAGINATION =================
  pageSize = 10;
  pageIndex = 0;

  displayedColumns: string[] = [
    'numero',
    'dateEmission',
    'montant',
    'typeFacture',
    'statut',
    'actions'
  ];

  // ================= ENUMS =================
  statuts: StatutFacture[] = ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE'];
  types: TypeFacture[] = ['HONORAIRES', 'FRAIS', 'EXPERTISE', 'AUTRE'];

  statutLabels = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typeLabels = TYPE_FACTURE_LABELS as Record<TypeFacture, string>;

  ngOnInit(): void {
    this.loadFactures();
  }

  // ================= LOAD =================
  loadFactures(): void {
    this.isLoading.set(true);

    this.factureService.getAll().subscribe({
      next: (data) => {
        this.factures.set(data || []);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => {
        this.showNotification('Erreur chargement factures', 'error');
        this.isLoading.set(false);
      }
    });
  }

  // ================= FILTER =================
  applyFilter(): void {
    let result = [...this.factures()];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(f =>
        f.numero.toLowerCase().includes(q) ||
        f.montant?.toString().includes(q)
      );
    }

    if (this.statusFilter) {
      result = result.filter(f => f.statut === this.statusFilter);
    }

    if (this.typeFilter) {
      result = result.filter(f => f.typeFacture === this.typeFilter);
    }

    this.filteredFactures.set(result);
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  // ================= PAGINATION =================
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  // ================= CREATE =================
  openNewFacture(): void {
    const dialogRef = this.dialog.open(FactureFormDialogComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.factureService.create(result).subscribe({
          next: () => {
            this.showNotification('Facture créée avec succès', 'success');
            this.loadFactures();
          },
          error: () => this.showNotification('Erreur création facture', 'error')
        });
      }
    });
  }

  // ================= EDIT =================
  openEditFacture(f: Facture): void {
    const dialogRef = this.dialog.open(FactureFormDialogComponent, {
      width: '600px',
      data: { facture: f, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.factureService.update(f.id!, result).subscribe({
          next: () => {
            this.showNotification('Facture modifiée avec succès', 'success');
            this.loadFactures();
          },
          error: () => this.showNotification('Erreur modification', 'error')
        });
      }
    });
  }

  // ================= STATUS TOGGLE =================
  toggleStatus(f: Facture): void {
    const newStatus: StatutFacture =
      f.statut === 'EN_ATTENTE' ? 'VALIDEE' : 'EN_ATTENTE';

    this.factureService.updateStatus(f.id!, newStatus).subscribe({
      next: () => this.loadFactures(),
      error: () => this.showNotification('Erreur statut', 'error')
    });
  }

  // ================= DELETE =================
  confirmDelete(f: Facture): void {
    if (confirm(`Supprimer ${f.numero} ?`)) {
      this.factureService.delete(f.id!).subscribe({
        next: () => {
          this.showNotification('Facture supprimée', 'success');
          this.loadFactures();
        },
        error: () => this.showNotification('Erreur suppression', 'error')
      });
    }
  }

  // ================= DETAIL =================
  showDetail(f: Facture): void {
    this.snackBar.open(
      `${f.numero} - ${f.montant} DT - ${this.statutLabels[f.statut]}`,
      'OK',
      { duration: 3000 }
    );
  }

  // ================= RESET FILTER =================
  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.applyFilter();
  }

  // ================= NOTIFICATION =================
  showNotification(msg: string, type: 'success' | 'error'): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }
}
