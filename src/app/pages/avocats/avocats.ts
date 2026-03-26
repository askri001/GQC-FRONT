import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

import { Prestataire } from '../../core/models';
import { PrestataireService } from '../../core/services/prestataire.service';
import { AvocatFormDialogComponent, AvocatFormDialogData } from './avocat-form-dialog';

@Component({
  selector: 'app-avocats',
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
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">gavel</mat-icon>
            <h2>Gestion des Avocats</h2>
          </div>
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon>
            Nouvel Avocat
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="searchQuery" (keyup)="applyFilter()" placeholder="Nom, spécialité...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Spécialité</mat-label>
            <mat-select [(ngModel)]="specialiteFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Toutes</mat-option>
              @for (spec of specialites; track spec) {
                <mat-option [value]="spec">{{ spec }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="actifFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              <mat-option [value]="true">Actifs</mat-option>
              <mat-option [value]="false">Inactifs</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement des avocats...</p>
          </div>
        }

        @if (!isLoading()) {
          <div class="table-container">
            <table mat-table [dataSource]="filteredAvocats()" class="full-width">
              <ng-container matColumnDef="nom">
                <th mat-header-cell *matHeaderCellDef>Nom</th>
                <td mat-cell *matCellDef="let p">{{ getFullName(p) }}</td>
              </ng-container>

              <ng-container matColumnDef="telephone">
                <th mat-header-cell *matHeaderCellDef>Téléphone</th>
                <td mat-cell *matCellDef="let p">{{ p.telephone }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let p">{{ p.email }}</td>
              </ng-container>

              <ng-container matColumnDef="specialite">
                <th mat-header-cell *matHeaderCellDef>Spécialité</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip class="specialite-chip">{{ p.specialite }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="tarifJournalier">
Tarif (DT/j)
                <td mat-cell *matCellDef="let p">
                  <span class="tarif">{{ p.tarifJournalier | number:'1.0-0' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actif">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class]="'statut-chip statut-' + (p.actif ? 'actif' : 'inactif')">
                    {{ p.actif ? 'Actif' : 'Inactif' }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let p">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Options">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openEditDialog(p)">
                      <mat-icon>edit</mat-icon>
                      <span>Modifier</span>
                    </button>
                    <button mat-menu-item (click)="toggleStatus(p)">
                      <mat-icon>swap_horiz</mat-icon>
                      <span>{{ p.actif ? 'Désactiver' : 'Activer' }}</span>
                    </button>
                    <button mat-menu-item (click)="confirmDelete(p)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Supprimer</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="avocat-row"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  <mat-icon>person_off</mat-icon>
                  <p>Aucun avocat trouvé</p>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator 
            [length]="filteredAvocats().length"
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
    .page-container { padding: 0; }
    .page-card { padding: 24px; border-radius: 12px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .header-title { display: flex; align-items: center; gap: 12px; }
    .title-icon { font-size: 32px; width: 32px; height: 32px; color: #1a237e; }
    .card-header h2 { margin: 0; color: #1a237e; font-size: 24px; font-weight: 500; }
    .filters { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 250px; }
    .filter-field { width: 200px; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .specialite-chip { background: #e3f2fd !important; color: #1976d2 !important; font-size: 12px; }
    .tarif { font-weight: 600; color: #2e7d32; }
    .statut-chip { font-weight: 500; }
    .statut-actif { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .statut-inactif { background: #ffebee !important; color: #c62828 !important; }
    .avocat-row:hover { background: #f5f5f5; }
    .no-data { text-align: center; padding: 40px !important; color: #9e9e9e; }
    .no-data mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 10px; }
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: #666; }
    .loading-container p { margin-top: 16px; }
    .delete-action { color: #f44336; }
    mat-paginator { margin-top: 20px; }
  `]
})
export class AvocatsComponent implements OnInit {
  private prestataireService = inject(PrestataireService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  avocats = signal<Prestataire[]>([]);
  filteredAvocats = signal<Prestataire[]>([]);
  isLoading = signal<boolean>(false);

  displayedColumns = ['nom', 'telephone', 'email', 'specialite', 'tarifJournalier', 'actif', 'actions'];

  searchQuery = '';
  specialiteFilter = '';
  actifFilter = '';

  pageSize = 10;
  currentPage = 0;

  specialites = ['Civil', 'Pénal', 'Commercial', 'Travail'];

  ngOnInit(): void {
    this.loadAvocats();
  }

  loadAvocats(): void {
    this.isLoading.set(true);
    this.prestataireService.getByType('AVOCAT').subscribe({
      next: (data) => {
        this.avocats.set(data);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading avocats:', error);
        this.isLoading.set(false);
        this.showNotification('Erreur lors du chargement des avocats', 'error');
      }
    });
  }

  applyFilter(): void {
    let result = [...this.avocats()];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p => 
        this.getFullName(p).toLowerCase().includes(query) ||
        p.specialite.toLowerCase().includes(query)
      );
    }

    if (this.specialiteFilter) {
      result = result.filter(p => p.specialite === this.specialiteFilter);
    }

    if (this.actifFilter !== '') {
      result = result.filter(p => p.actif === (this.actifFilter === 'true'));
    }

    this.filteredAvocats.set(result);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getFullName(p: Prestataire): string {
    return `${p.prenom || ''} ${p.nom || ''}`.trim();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AvocatFormDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createAvocat(result);
      }
    });
  }

  openEditDialog(avocat: Prestataire): void {
    const dialogRef = this.dialog.open(AvocatFormDialogComponent, {
      width: '500px',
      data: { prestataire: avocat, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateAvocat(avocat.id!, result);
      }
    });
  }

  toggleStatus(avocat: Prestataire): void {
    const newStatus = !avocat.actif;
    if (confirm(`Voulez-vous ${newStatus ? 'activer' : 'désactiver'} cet avocat ?`)) {
      this.prestataireService.updateStatus(avocat.id!, newStatus).subscribe({
        next: (updated) => {
          this.avocats.update(list => list.map(p => p.id === avocat.id ? updated : p));
          this.applyFilter();
          this.showNotification('Statut mis à jour', 'success');
        },
        error: (error) => this.showNotification('Erreur mise à jour statut', 'error')
      });
    }
  }

  createAvocat(data: Partial<Prestataire>): void {
    this.prestataireService.create(data).subscribe({
      next: (newAvocat) => {
        this.avocats.update(list => [...list, newAvocat]);
        this.applyFilter();
        this.showNotification('Avocat créé avec succès', 'success');
      },
      error: (error) => {
        console.error('Error creating avocat:', error);
        this.showNotification('Erreur lors de la création', 'error');
      }
    });
  }

  updateAvocat(id: number, data: Partial<Prestataire>): void {
    this.prestataireService.update(id, data).subscribe({
      next: (updated) => {
        this.avocats.update(list => list.map(p => p.id === id ? updated : p));
        this.applyFilter();
        this.showNotification('Avocat mis à jour avec succès', 'success');
      },
      error: (error) => {
        console.error('Error updating avocat:', error);
        this.showNotification('Erreur lors de la mise à jour', 'error');
      }
    });
  }

  confirmDelete(avocat: Prestataire): void {
    if (confirm(`Supprimer l'avocat "${this.getFullName(avocat)}" ? Action irréversible.`)) {
      this.deleteAvocat(avocat.id!);
    }
  }

  deleteAvocat(id: number): void {
    this.prestataireService.delete(id).subscribe({
      next: () => {
        this.avocats.update(list => list.filter(p => p.id !== id));
        this.applyFilter();
        this.showNotification('Avocat supprimé avec succès', 'success');
      },
      error: (error) => {
        console.error('Error deleting avocat:', error);
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

