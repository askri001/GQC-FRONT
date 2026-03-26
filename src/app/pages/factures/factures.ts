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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { Facture, StatutFacture, TypeFacture, STATUT_FACTURE_LABELS, TYPE_FACTURE_LABELS } from '../../core/models';
import { FactureService } from '../../core/services/facture.service';
import { FactureFormDialogComponent, FactureFormDialogData } from './facture-form-dialog';


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
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatPaginatorModule,
    DatePipe
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <!-- Header -->
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">receipt_long</mat-icon>
            <h2>Gestion des Factures</h2>
          </div>
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon>
            Nouvelle Facture
          </button>
        </div>

        <!-- Filters -->
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="searchQuery" (keyup)="applyFilter()" placeholder="Numéro, montant...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              @for (statut of statuts; track statut) {
                <mat-option [value]="statut">{{ statutLabels[statut] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              @for (type of types; track type) {
                <mat-option [value]="type">{{ typeLabels[type] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement des factures...</p>
          </div>
        }

        <!-- Table -->
        @if (!isLoading()) {
          <div class="table-container">
            <table mat-table [dataSource]="filteredFactures()" class="full-width">
              <!-- Numero -->
              <ng-container matColumnDef="numero">
                <th mat-header-cell *matHeaderCellDef>N° Facture</th>
                <td mat-cell *matCellDef="let f">
                  <span class="facture-numero">{{ f.numero }}</span>
                </td>
              </ng-container>

              <!-- Date Emission -->
              <ng-container matColumnDef="dateEmission">
                <th mat-header-cell *matHeaderCellDef>Date Émission</th>
                <td mat-cell *matCellDef="let f">{{ f.dateEmission | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <!-- Montant -->
              <ng-container matColumnDef="montant">
                <th mat-header-cell *matHeaderCellDef>Montant</th>
                <td mat-cell *matCellDef="let f">
                  <span class="montant">{{ f.montant | number:'1.2-2' }} DT</span>
                </td>
              </ng-container>

              <!-- Type -->
              <ng-container matColumnDef="typeFacture">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let f">
                  <mat-chip class="type-chip">{{ getTypeLabel(f.typeFacture) }}</mat-chip>
                </td>
              </ng-container>

              <!-- Statut -->
              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let f">
                  <mat-chip [class]="'statut-chip statut-' + f.statut.toLowerCase()">
                    {{ getStatutLabel(f.statut) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let f">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Options">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openEditDialog(f)">
                      <mat-icon>edit</mat-icon>
                      <span>Modifier</span>
                    </button>
                    <button mat-menu-item (click)="openStatusDialog(f)">
                      <mat-icon>swap_horiz</mat-icon>
                      <span>Changer le statut</span>
                    </button>
                    <button mat-menu-item (click)="confirmDelete(f)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Supprimer</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="facture-row"></tr>

              <!-- No Data -->
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  <mat-icon>inbox</mat-icon>
                  <p>Aucune facture trouvée</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Paginator -->
          <mat-paginator 
            [length]="filteredFactures().length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 0;
    }

    .page-card {
      padding: 24px;
      border-radius: 12px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .title-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1a237e;
    }

    .card-header h2 {
      margin: 0;
      color: #1a237e;
      font-size: 24px;
      font-weight: 500;
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-field {
      width: 180px;
    }

    .table-container {
      overflow-x: auto;
    }

    .full-width {
      width: 100%;
    }

    .facture-numero {
      font-weight: 600;
      color: #2e7d32;
    }

    .montant {
      font-weight: 600;
      font-size: 15px;
      color: #2e7d32;
    }

    .type-chip {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .statut-chip {
      font-weight: 500;
    }

    .statut-payee {
      background: #c8e6c9 !important;
      color: #1b5e20 !important;
    }

    .statut-validee {
      background: #b3e5fc !important;
      color: #0277bd !important;
    }

    .statut-en_attente {
      background: #fff3e0 !important;
      color: #ef6c00 !important;
    }

    .statut-rejetee {
      background: #ffcdd2 !important;
      color: #c62828 !important;
    }

    .facture-row:hover {
      background: #f5f5f5;
    }

    .no-data {
      text-align: center;
      padding: 40px !important;
      color: #9e9e9e;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 10px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: #666;
    }

    .loading-container p {
      margin-top: 16px;
    }

    .delete-action {
      color: #f44336;
    }

    mat-paginator {
      margin-top: 20px;
    }

    ::ng-deep .mat-mdc-form-field {
      --mdc-filled-text-field-container-color: transparent;
    }
  `]
})
export class FacturesComponent implements OnInit {
  private factureService = inject(FactureService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Signals
  factures = signal<Facture[]>([]);
  filteredFactures = signal<Facture[]>([]);
  isLoading = signal<boolean>(false);

  // Display
  displayedColumns = ['numero', 'dateEmission', 'montant', 'typeFacture', 'statut', 'actions'];

  // Filters
  searchQuery = '';
  statusFilter = '';
  typeFilter = '';

  // Pagination
  pageSize = 10;
  currentPage = 0;

  // Constants
  statuts: StatutFacture[] = ['EN_ATTENTE', 'VALIDEE', 'PAYEE', 'REJETEE'];
  types = ['HONORAIRES', 'FRAIS', 'EXPERTISE', 'AUTRE'] as const;
  statutLabels = STATUT_FACTURE_LABELS;
  typeLabels = TYPE_FACTURE_LABELS;

  // Helper methods for template
  getStatutLabel(statut: string): string {
    return STATUT_FACTURE_LABELS[statut as StatutFacture] || statut;
  }

  getTypeLabel(type: string): string {
    return TYPE_FACTURE_LABELS[type as TypeFacture] || type;
  }

  ngOnInit(): void {
    this.loadFactures();
  }

  loadFactures(): void {
    this.isLoading.set(true);
    
    this.factureService.getAll().subscribe({
      next: (data) => {
        this.factures.set(data);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading factures:', error);
        this.isLoading.set(false);
        this.showNotification('Erreur lors du chargement des factures', 'error');
      }
    });
  }

  applyFilter(): void {
    let result = [...this.factures()];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(f => 
        f.numero.toLowerCase().includes(query) ||
        f.montant.toString().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter) {
      result = result.filter(f => f.statut === this.statusFilter);
    }

    // Type filter
    if (this.typeFilter) {
      result = result.filter(f => f.typeFacture === this.typeFilter);
    }

    this.filteredFactures.set(result);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(FactureFormDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFacture(result);
      }
    });
  }

  openEditDialog(facture: Facture): void {
    const dialogRef = this.dialog.open(FactureFormDialogComponent, {
      width: '500px',
      data: { facture, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateFacture(facture.id!, result);
      }
    });
  }

  openStatusDialog(facture: Facture): void {
    // Quick status change menu
    const currentStatut = facture.statut;
    const availableStatuts = this.statuts.filter(s => s !== currentStatut);

    // Use a simple approach - cycle through statuses
    const nextStatut = availableStatuts[0];
    if (confirm(`Voulez-vous changer le statut de "${this.statutLabels[currentStatut]}" à "${this.statutLabels[nextStatut]}" ?`)) {
      this.updateStatus(facture.id!, nextStatut);
    }
  }

  createFacture(data: Partial<Facture>): void {
    this.factureService.create(data).subscribe({
      next: (newFacture) => {
        this.factures.update(list => [...list, newFacture]);
        this.applyFilter();
        this.showNotification('Facture créée avec succès', 'success');
      },
      error: (error) => {
        console.error('Error creating facture:', error);
        this.showNotification('Erreur lors de la création', 'error');
      }
    });
  }

  updateFacture(id: number, data: Partial<Facture>): void {
    this.factureService.update(id, data).subscribe({
      next: (updated) => {
        this.factures.update(list => 
          list.map(f => f.id === id ? { ...f, ...updated } : f)
        );
        this.applyFilter();
        this.showNotification('Facture mise à jour avec succès', 'success');
      },
      error: (error) => {
        console.error('Error updating facture:', error);
        this.showNotification('Erreur lors de la mise à jour', 'error');
      }
    });
  }

  updateStatus(id: number, statut: StatutFacture): void {
    this.factureService.updateStatus(id, statut).subscribe({
      next: (updated) => {
        this.factures.update(list => 
          list.map(f => f.id === id ? { ...f, ...updated } : f)
        );
        this.applyFilter();
        this.showNotification('Statut mis à jour avec succès', 'success');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.showNotification('Erreur lors de la mise à jour du statut', 'error');
      }
    });
  }

  confirmDelete(facture: Facture): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture "${facture.numero}" ? Cette action est irréversible.`)) {
      this.deleteFacture(facture.id!);
    }
  }

  deleteFacture(id: number): void {
    this.factureService.delete(id).subscribe({
      next: () => {
        this.factures.update(list => list.filter(f => f.id !== id));
        this.applyFilter();
        this.showNotification('Facture supprimée avec succès', 'success');
      },
      error: (error) => {
        console.error('Error deleting facture:', error);
        this.showNotification('Erreur lors de la suppression', 'error');
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }
}

