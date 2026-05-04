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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { GarantieService } from '../../core/services/garantie.service';
import { ApiService } from '../../core/services/api.service';
import { Garantie, TYPE_GARANTIE_LABELS, STATUT_GARANTIE_LABELS, TypeGarantie, StatutGarantie } from '../../core/models/garantie.model';
import { Risque } from '../../core/models/risque.model';

@Component({
  selector: 'app-garanties',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">verified_user</mat-icon>
            <h2>Gestion des Garanties</h2>
          </div>
          <button mat-raised-button color="primary" (click)="createGarantie()">
            <mat-icon>add</mat-icon> Nouvelle Garantie
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()"
              placeholder="Rechercher par type ou description...">
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="statutFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="REALISEE">Réalisée</mat-option>
              <mat-option value="EXPIREE">Expirée</mat-option>
              <mat-option value="INVALIDEE">Invalidée</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        @if (loading()) {
          <div class="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des garanties...</p>
          </div>
        } @else if (pagedGaranties().length === 0) {
          <div class="no-data">
            <mat-icon>verified_user</mat-icon>
            <p>Aucune garantie trouvée</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="pagedGaranties()" class="mat-elevation-z2 full-width">

              <ng-container matColumnDef="typeGarantie">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let g">{{ getTypeLabel(g.typeGarantie) }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let g">{{ g.description }}</td>
              </ng-container>

              <ng-container matColumnDef="valeur">
                <th mat-header-cell *matHeaderCellDef>Valeur</th>
                <td mat-cell *matCellDef="let g">{{ g.valeur | number:'1.0-0' }} DT</td>
              </ng-container>

              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let g">
                  <mat-chip [class]="'statut-' + g.statut?.toLowerCase()">
                    {{ getStatutLabel(g.statut) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="risque">
                <th mat-header-cell *matHeaderCellDef>Risque ID</th>
                <td mat-cell *matCellDef="let g">{{ g.risqueId }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let g">
                  <button mat-icon-button color="primary" (click)="editGarantie(g)" title="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteGarantie(g.idGarantie!)" title="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="filteredGaranties().length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25]"
              (page)="onPageChange($event)">
            </mat-paginator>
          </div>
        }

        @if (editMode()) {
          <div class="inline-edit-row">
            <h4>{{ editId() === 0 ? 'Nouvelle' : 'Modifier' }} Garantie</h4>
            <div class="edit-form">

              <mat-form-field appearance="outline">
                <mat-label>Risque *</mat-label>
                <mat-select [(ngModel)]="tempGarantie().risqueId">
                  <mat-option [value]="0" disabled>Sélectionner un risque</mat-option>
                  @for (r of risques(); track r.id) {
                    <mat-option [value]="r.id">Risque #{{ r.id }} — {{ r.montantTotal | number:'1.0-0' }} DT</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Type de Garantie *</mat-label>
                <mat-select [(ngModel)]="tempGarantie().typeGarantie">
                  <mat-option value="HYPOTHEQUE">Hypothèque</mat-option>
                  <mat-option value="GAGE">Gage</mat-option>
                  <mat-option value="CAUTION">Caution</mat-option>
                  <mat-option value="ASSURANCE">Assurance</mat-option>
                  <mat-option value="AUTRE">Autre</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempGarantie().description" placeholder="Description *">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput type="number" [(ngModel)]="tempGarantie().valeur" placeholder="Valeur (DT) *">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select [(ngModel)]="tempGarantie().statut">
                  <mat-option value="ACTIVE">Active</mat-option>
                  <mat-option value="REALISEE">Réalisée</mat-option>
                  <mat-option value="EXPIREE">Expirée</mat-option>
                  <mat-option value="INVALIDEE">Invalidée</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveGarantie()"
                  [disabled]="!tempGarantie().typeGarantie || !tempGarantie().description || !tempGarantie().risqueId">
                  <mat-icon>save</mat-icon> {{ editId() === 0 ? 'Créer' : 'Sauvegarder' }}
                </button>
                <button mat-button color="warn" (click)="cancelEdit()">
                  <mat-icon>close</mat-icon> Annuler
                </button>
              </div>
            </div>
          </div>
        }
      </mat-card>
    </div>
  `,
  styleUrls: ['./garanties.css']
})
export class GarantiesComponent implements OnInit {
  private garantieService = inject(GarantieService);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  garanties = signal<Garantie[]>([]);
  risques = signal<Risque[]>([]);
  loading = signal(false);

  searchTerm = '';
  statutFilter = '';
  pageSize = 10;
  currentPage = 0;

  editId = signal<number | null>(null);
  editMode = signal(false);
  tempGarantie = signal<Partial<Garantie>>({});

  displayedColumns = ['typeGarantie', 'description', 'valeur', 'statut', 'risque', 'actions'];

  filteredGaranties = signal<Garantie[]>([]);

  pagedGaranties = () => {
    const start = this.currentPage * this.pageSize;
    return this.filteredGaranties().slice(start, start + this.pageSize);
  };

  ngOnInit() {
    this.loadGaranties();
    this.loadRisques();
  }

  loadGaranties() {
    this.loading.set(true);
    this.garantieService.getAll().subscribe({
      next: (data) => {
        this.garanties.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading garanties', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement garanties', 'error');
      }
    });
  }

  loadRisques() {
    this.api.get<Risque[]>('/risques').subscribe({
      next: (data) => this.risques.set(data),
      error: (err) => console.error('Error loading risques', err)
    });
  }

  applyFilter() {
    let result = this.garanties();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(g =>
        g.typeGarantie?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term)
      );
    }
    if (this.statutFilter) {
      result = result.filter(g => g.statut === this.statutFilter);
    }
    this.filteredGaranties.set(result);
    this.currentPage = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  createGarantie() {
    this.editId.set(0);
    this.tempGarantie.set({
      typeGarantie: undefined,
      description: '',
      valeur: 0,
      statut: 'ACTIVE',
      risqueId: 0
    });
    this.editMode.set(true);
  }

  editGarantie(garantie: Garantie) {
    this.editId.set(garantie.idGarantie!);
    this.tempGarantie.set({ ...garantie });
    this.editMode.set(true);
  }

  saveGarantie() {
    const temp = this.tempGarantie();
    if (!temp.typeGarantie || !temp.description || !temp.risqueId) {
      this.showNotification('Type, description et risque sont requis', 'error');
      return;
    }

    const request = this.editId() === 0
      ? this.garantieService.create(temp)
      : this.garantieService.update(this.editId()!, temp);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadGaranties();
        this.cancelEdit();
        this.showNotification('Garantie sauvegardée', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  deleteGarantie(id: number) {
    if (confirm('Confirmer la suppression de cette garantie ?')) {
      this.garantieService.delete(id).subscribe({
        next: () => {
          this.loadGaranties();
          this.showNotification('Garantie supprimée', 'success');
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
    this.tempGarantie.set({});
    this.editMode.set(false);
  }

  getTypeLabel(type: string): string {
    return TYPE_GARANTIE_LABELS[type as TypeGarantie] || type;
  }

  getStatutLabel(statut: string): string {
    return STATUT_GARANTIE_LABELS[statut as StatutGarantie] || statut;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}
