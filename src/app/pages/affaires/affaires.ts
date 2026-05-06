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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AffaireService } from '../../core/services/affaire.service';
import { ApiService } from '../../core/services/api.service';
import { Affaire, STATUT_AFFAIRE_LABELS } from '../../core/models/affaire.model';
import { Dossier } from '../../core/models/dossier.model';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

interface PrestataireRef { idPrestataire: number; nom: string; prenom: string; typePrestataire: string; }

@Component({
  selector: 'app-affaires',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    DrawerPanelComponent
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">gavel</mat-icon>
            <h2>Gestion des Affaires</h2>
          </div>
          <button mat-raised-button color="primary" (click)="createAffaire()">
            <mat-icon>add</mat-icon> Nouvelle Affaire
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()"
              placeholder="Rechercher par N° procédure ou tribunal...">
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="statutFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              <mat-option value="INITIEE">Initiée</mat-option>
              <mat-option value="EN_COURS">En Cours</mat-option>
              <mat-option value="JUGEMENT_RENDU">Jugement Rendu</mat-option>
              <mat-option value="TERMINEE">Terminée</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        @if (loading()) {
          <div class="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des affaires...</p>
          </div>
        } @else if (filteredAffaires().length === 0) {
          <div class="no-data">
            <mat-icon>gavel</mat-icon>
            <p>Aucune affaire trouvée</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="pagedAffaires()" class="mat-elevation-z2 full-width">
              <ng-container matColumnDef="numeroProcedure">
                <th mat-header-cell *matHeaderCellDef>N° Procédure</th>
                <td mat-cell *matCellDef="let a">{{ a.numeroProcedure }}</td>
              </ng-container>
              <ng-container matColumnDef="dateDebut">
                <th mat-header-cell *matHeaderCellDef>Date Début</th>
                <td mat-cell *matCellDef="let a">{{ a.dateDebut | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="tribunal">
                <th mat-header-cell *matHeaderCellDef>Tribunal</th>
                <td mat-cell *matCellDef="let a">{{ a.tribunal }}</td>
              </ng-container>
              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let a">
                  <mat-chip [class]="'statut-' + a.statut?.toLowerCase()">{{ getStatutLabel(a.statut) }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="jugement">
                <th mat-header-cell *matHeaderCellDef>Jugement</th>
                <td mat-cell *matCellDef="let a">{{ a.jugement || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="dossier">
                <th mat-header-cell *matHeaderCellDef>Dossier</th>
                <td mat-cell *matCellDef="let a">{{ getDossierRef(a.dossierId) }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let a">
                  <button mat-icon-button color="primary" (click)="editAffaire(a)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="deleteAffaire(a.idAffaire!)"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            <mat-paginator [length]="filteredAffaires().length" [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)"></mat-paginator>
          </div>
        }
      </mat-card>
    </div>

    <!-- Drawer -->
    <app-drawer-panel
      [open]="editMode()"
      [title]="editId() === 0 ? 'Nouvelle Affaire' : 'Modifier Affaire'"
      icon="gavel"
      [saveLabel]="editId() === 0 ? 'Créer' : 'Sauvegarder'"
      [saveDisabled]="!tempAffaire().numeroProcedure || !tempAffaire().tribunal || !tempAffaire().dossierId"
      [saving]="loading()"
      (closed)="cancelEdit()"
      (saved)="saveAffaire()">

      <mat-form-field appearance="outline">
        <mat-label>Dossier *</mat-label>
        <mat-select [(ngModel)]="tempAffaire().dossierId">
          <mat-option [value]="0" disabled>Sélectionner un dossier</mat-option>
          @for (d of dossiers(); track d.idDossier) {
            <mat-option [value]="d.idDossier">{{ d.reference }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>N° Procédure *</mat-label>
        <input matInput [(ngModel)]="tempAffaire().numeroProcedure">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Date Début</mat-label>
        <input matInput [matDatepicker]="datePicker" [(ngModel)]="tempAffaire().dateDebut">
        <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
        <mat-datepicker #datePicker></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Tribunal *</mat-label>
        <input matInput [(ngModel)]="tempAffaire().tribunal">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Statut</mat-label>
        <mat-select [(ngModel)]="tempAffaire().statut">
          <mat-option value="INITIEE">Initiée</mat-option>
          <mat-option value="EN_COURS">En Cours</mat-option>
          <mat-option value="JUGEMENT_RENDU">Jugement Rendu</mat-option>
          <mat-option value="TERMINEE">Terminée</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Jugement</mat-label>
        <input matInput [(ngModel)]="tempAffaire().jugement">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Prestataire assigné</mat-label>
        <mat-select [(ngModel)]="tempAffaire().prestataireId">
          <mat-option [value]="undefined">Aucun</mat-option>
          @for (p of prestataires(); track p.idPrestataire) {
            <mat-option [value]="p.idPrestataire">{{ p.prenom }} {{ p.nom }} ({{ p.typePrestataire }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </app-drawer-panel>
  `,
  styleUrls: ['./affaires.css']
})
export class AffairesComponent implements OnInit {
  private affaireService = inject(AffaireService);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  affaires = signal<Affaire[]>([]);
  dossiers = signal<Dossier[]>([]);
  prestataires = signal<PrestataireRef[]>([]);
  loading = signal(false);

  searchTerm = '';
  statutFilter = '';
  pageSize = 10;
  currentPage = 0;

  editId = signal<number | null>(null);
  editMode = signal(false);
  tempAffaire = signal<Partial<Affaire>>({});

  displayedColumns = ['numeroProcedure', 'dateDebut', 'tribunal', 'statut', 'jugement', 'dossier', 'actions'];

  filteredAffaires = signal<Affaire[]>([]);

  pagedAffaires = () => {
    const start = this.currentPage * this.pageSize;
    return this.filteredAffaires().slice(start, start + this.pageSize);
  };

  ngOnInit() {
    this.loadAffaires();
    this.loadDossiers();
    this.loadPrestataires();
  }

  loadAffaires() {
    this.loading.set(true);
    this.affaireService.getAll().subscribe({
      next: (data) => {
        this.affaires.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading affaires', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement affaires', 'error');
      }
    });
  }

  loadDossiers() {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => this.dossiers.set(data),
      error: (err) => console.error('Error loading dossiers', err)
    });
  }

  loadPrestataires() {
    this.api.get<PrestataireRef[]>('/prestataires').subscribe({
      next: (data) => this.prestataires.set(data),
      error: (err) => console.error('Error loading prestataires', err)
    });
  }

  applyFilter() {
    let result = this.affaires();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.numeroProcedure?.toLowerCase().includes(term) ||
        a.tribunal?.toLowerCase().includes(term)
      );
    }
    if (this.statutFilter) {
      result = result.filter(a => a.statut === this.statutFilter);
    }
    this.filteredAffaires.set(result);
    this.currentPage = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  createAffaire() {
    this.editId.set(0);
    this.tempAffaire.set({
      numeroProcedure: '',
      tribunal: '',
      statut: 'INITIEE',
      dossierId: 0,
      dateDebut: new Date()
    });
    this.editMode.set(true);
  }

  editAffaire(affaire: Affaire) {
    this.editId.set(affaire.idAffaire!);
    this.tempAffaire.set({ ...affaire });
    this.editMode.set(true);
  }

  saveAffaire() {
    const temp = this.tempAffaire();
    if (!temp.numeroProcedure || !temp.tribunal || !temp.dossierId) {
      this.showNotification('N° procédure, tribunal et dossier sont requis', 'error');
      return;
    }

    const request = this.editId() === 0
      ? this.affaireService.create(temp)
      : this.affaireService.update(this.editId()!, temp);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadAffaires();
        this.cancelEdit();
        this.showNotification('Affaire sauvegardée', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  deleteAffaire(id: number) {
    if (confirm('Confirmer la suppression de cette affaire ?')) {
      this.affaireService.delete(id).subscribe({
        next: () => {
          this.loadAffaires();
          this.showNotification('Affaire supprimée', 'success');
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
    this.tempAffaire.set({});
    this.editMode.set(false);
  }

  getStatutLabel(statut: string): string {
    return STATUT_AFFAIRE_LABELS[statut as keyof typeof STATUT_AFFAIRE_LABELS] || statut;
  }

  getDossierRef(dossierId: number): string {
    const dossier = this.dossiers().find(d => d.idDossier === dossierId);
    return dossier ? dossier.reference : `#${dossierId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}
