import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { RisqueService } from '../../core/services/risque.service';
import { RisqueFormDialogComponent, DialogData } from './risque-form-dialog';
import { Risque } from '../../core/models';

@Component({
  selector: 'app-risques',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div>
            <h2>Gestion des Risques</h2>
            <p class="subtitle">{{ filteredRisques().length }} risque(s) trouvé(s)</p>
          </div>
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Nouveau Risque
          </button>
        </div>

        @if (risqueService.error()) {
          <div class="error-banner">
            {{ risqueService.error() }}
            <button mat-icon-button (click)="risqueService.clearError()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }

        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="searchTerm" placeholder="Montant, date, dossier...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        @if (risqueService.loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement des risques...</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="filteredRisques()" class="full-width mat-elevation-z2">
              <ng-container matColumnDef="montantPrincipal">
                <th mat-header-cell *matHeaderCellDef>Montant Principal</th>
                <td mat-cell *matCellDef="let r">{{ r.montantPrincipal | number:'1.0-0' }} DH</td>
              </ng-container>
              <ng-container matColumnDef="montantInteret">
                <th mat-header-cell *matHeaderCellDef>Intérêts</th>
                <td mat-cell *matCellDef="let r">{{ r.montantInteret | number:'1.0-0' }} DH</td>
              </ng-container>
              <ng-container matColumnDef="montantTotal">
                <th mat-header-cell *matHeaderCellDef>Montant Total</th>
                <td mat-cell *matCellDef="let r"><strong>{{ r.montantTotal | number:'1.0-0' }} DH</strong></td>
              </ng-container>
              <ng-container matColumnDef="dateContrat">
                <th mat-header-cell *matHeaderCellDef>Date Contrat</th>
                <td mat-cell *matCellDef="let r">{{ r.dateContrat | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="dateEcheance">
                <th mat-header-cell *matHeaderCellDef>Échéance</th>
                <td mat-cell *matCellDef="let r">{{ r.dateEcheance | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="tauxInteret">
                <th mat-header-cell *matHeaderCellDef>Taux</th>
                <td mat-cell *matCellDef="let r">{{ r.tauxInteret }} %</td>
              </ng-container>
              <ng-container matColumnDef="dossierId">
                <th mat-header-cell *matHeaderCellDef>Dossier ID</th>
                <td mat-cell *matCellDef="let r">{{ r.dossierId }}</td>
              </ng-container>
              <ng-container matColumnDef="actif">
                <th mat-header-cell *matHeaderCellDef>Actif</th>
                <td mat-cell *matCellDef="let r">
                  <mat-icon [color]="r.actif ? 'primary' : 'warn'">{{ r.actif ? 'check_circle' : 'cancel' }}</mat-icon>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let r">
                  <button mat-icon-button color="primary" (click)="editRisque(r)" title="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteRisque(r.id!)" title="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="risque-row"></tr>

              @if (filteredRisques().length === 0) {
                <tr class="no-data-row">
                  <td [attr.colspan]="displayedColumns.length" class="no-data-cell">
                    <mat-icon>info</mat-icon>
                    <p>Aucun risque trouvé</p>
                  </td>
                </tr>
              }
            </table>
          </div>
        }

        <div class="table-footer">
          <button mat-stroked-button (click)="refreshData()" [disabled]="risqueService.loading()">
            <mat-icon>refresh</mat-icon> Actualiser
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; min-height: calc(100vh - 200px); }
    .page-card { height: 100%; }
    .card-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 24px; 
      flex-wrap: wrap; 
      gap: 16px; 
    }
    .card-header h2 { margin: 0; color: #1a237e; }
    .subtitle { margin: 0; color: #666; font-size: 0.9em; }
    .error-banner { 
      background: #ffebee; 
      color: #c62828; 
      padding: 12px; 
      border-radius: 4px; 
      margin-bottom: 16px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .search-section { margin-bottom: 20px; }
    .search-field { width: 100%; max-width: 400px; }
    .loading-container { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      padding: 60px 20px; 
      color: #666; 
    }
    .table-container { position: relative; }
    .full-width { width: 100%; }
    .risque-row:hover { background: #f5f5f5; }
    .no-data-row { height: 120px; }
    .no-data-cell { 
      text-align: center; 
      color: #999; 
      padding: 40px; 
    }
    .table-footer { 
      margin-top: 24px; 
      text-align: center; 
    }
    @media (max-width: 768px) {
      .card-header { flex-direction: column; align-items: stretch; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class RisquesComponent implements OnInit {
  searchTerm = '';
  displayedColumns: string[] = [
    'montantPrincipal', 'montantInteret', 'montantTotal', 
    'dateContrat', 'dateEcheance', 'tauxInteret', 
    'dossierId', 'actif', 'actions'
  ];
  private sub?: Subscription;
  private dialogRef?: any;

  constructor(
    public risqueService: RisqueService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Auto-load data on init
    effect(() => {
      if (!this.risqueService.loading() && this.risqueService.risques().length === 0) {
        this.loadData();
      }
    });
  }

  ngOnInit() {}

  loadData() {
    this.sub = this.risqueService.getAll().subscribe();
  }

  refreshData() {
    this.loadData();
    this.snackBar.open('Données actualisées', 'OK', { duration: 2000 });
  }

  filteredRisques = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const all = this.risqueService.risques();
    return all.filter(r => 
      r.montantPrincipal.toString().includes(term) ||
      r.montantTotal.toString().includes(term) ||
      r.dossierId.toString().includes(term) ||
      r.dateContrat.toLocaleDateString().includes(term) ||
      r.tauxInteret.toString().includes(term)
    );
  });

  openDialog(risque?: Risque) {
    this.dialogRef = this.dialog.open(RisqueFormDialogComponent, {
      width: '600px',
      data: { risque: risque || null }
    });

this.dialogRef.afterClosed().subscribe((result: Risque | null) => {
      if (result) {
        const message = result.id ? 'Risque mis à jour' : 'Risque créé';
        this.snackBar.open(message, 'OK', { duration: 3000 });
        // Refresh if needed
        if (!this.risqueService.risques().some(r => r.id === result.id)) {
          this.loadData();
        }
      }
    });
  }

  editRisque(risque: Risque) {
    this.openDialog(risque);
  }

  deleteRisque(id: number) {
    if (confirm('Supprimer ce risque ?')) {
      this.sub = this.risqueService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Risque supprimé', 'OK', { duration: 2000 });
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.snackBar.open('Erreur suppression', 'OK');
        }
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

