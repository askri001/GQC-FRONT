import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AudienceService } from '../../core/services/audience.service';
import { ApiService } from '../../core/services/api.service';
import { Audience } from '../../core/models/audience.model';
import { Affaire } from '../../core/models/affaire.model';

@Component({
  selector: 'app-audiences',
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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">event</mat-icon>
            <h2>Gestion des Audiences</h2>
          </div>
          <button mat-raised-button color="primary" (click)="createAudience()">
            <mat-icon>add</mat-icon> Nouvelle Audience
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()"
              placeholder="Rechercher par type ou décision...">
          </mat-form-field>
        </div>

        @if (loading()) {
          <div class="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des audiences...</p>
          </div>
        } @else if (pagedAudiences().length === 0) {
          <div class="no-data">
            <mat-icon>event</mat-icon>
            <p>Aucune audience trouvée</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="pagedAudiences()" class="mat-elevation-z2 full-width">

              <ng-container matColumnDef="dateAudience">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let a">{{ a.dateAudience | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="typeAudience">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let a">{{ a.typeAudience || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="decision">
                <th mat-header-cell *matHeaderCellDef>Décision</th>
                <td mat-cell *matCellDef="let a">{{ a.decision || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="observation">
                <th mat-header-cell *matHeaderCellDef>Observation</th>
                <td mat-cell *matCellDef="let a">{{ a.observation || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="commentaire">
                <th mat-header-cell *matHeaderCellDef>Commentaire</th>
                <td mat-cell *matCellDef="let a">{{ a.commentaire || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="affaire">
                <th mat-header-cell *matHeaderCellDef>Affaire</th>
                <td mat-cell *matCellDef="let a">{{ getAffaireRef(a.affaireId) }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let a">
                  <button mat-icon-button color="primary" (click)="editAudience(a)" title="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteAudience(a.id!)" title="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="filteredAudiences().length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25]"
              (page)="onPageChange($event)">
            </mat-paginator>
          </div>
        }

        @if (editMode()) {
          <div class="inline-edit-row">
            <h4>{{ editId() === 0 ? 'Nouvelle' : 'Modifier' }} Audience</h4>
            <div class="edit-form">

              <mat-form-field appearance="outline">
                <mat-label>Affaire *</mat-label>
                <mat-select [(ngModel)]="tempAudience().affaireId">
                  <mat-option [value]="0" disabled>Sélectionner une affaire</mat-option>
                  @for (af of affaires(); track af.id) {
                    <mat-option [value]="af.id">{{ af.numeroProcedure }} — {{ af.tribunal }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date Audience *</mat-label>
                <input matInput [matDatepicker]="datePicker" [(ngModel)]="tempAudience().dateAudience">
                <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                <mat-datepicker #datePicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempAudience().typeAudience" placeholder="Type d'audience">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempAudience().decision" placeholder="Décision">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempAudience().observation" placeholder="Observation">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <input matInput [(ngModel)]="tempAudience().commentaire" placeholder="Commentaire">
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="saveAudience()"
                  [disabled]="!tempAudience().affaireId || !tempAudience().dateAudience">
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
  styles: [`
    .page-container { padding: 24px; }
    .page-card { padding: 24px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header-title { display: flex; align-items: center; gap: 8px; }
    .header-title h2 { margin: 0; }
    .filters { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .loading, .no-data { display: flex; flex-direction: column; align-items: center; padding: 40px; color: #666; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .inline-edit-row { margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
    .inline-edit-row h4 { margin: 0 0 16px 0; }
    .edit-form { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
    .edit-form mat-form-field { min-width: 200px; }
    .form-actions { display: flex; gap: 8px; align-items: center; padding-top: 8px; }
  `]
})
export class AudiencesComponent implements OnInit {
  private audienceService = inject(AudienceService);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  audiences = signal<Audience[]>([]);
  affaires = signal<Affaire[]>([]);
  loading = signal(false);

  searchTerm = '';
  pageSize = 10;
  currentPage = 0;

  editId = signal<number | null>(null);
  editMode = signal(false);
  tempAudience = signal<Partial<Audience>>({});

  displayedColumns = ['dateAudience', 'typeAudience', 'decision', 'observation', 'commentaire', 'affaire', 'actions'];

  filteredAudiences = signal<Audience[]>([]);

  pagedAudiences = () => {
    const start = this.currentPage * this.pageSize;
    return this.filteredAudiences().slice(start, start + this.pageSize);
  };

  ngOnInit() {
    this.loadAudiences();
    this.loadAffaires();
  }

  loadAudiences() {
    this.loading.set(true);
    this.audienceService.getAll().subscribe({
      next: (data) => {
        this.audiences.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading audiences', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement audiences', 'error');
      }
    });
  }

  loadAffaires() {
    this.api.get<Affaire[]>('/affaires').subscribe({
      next: (data) => this.affaires.set(data),
      error: (err) => console.error('Error loading affaires', err)
    });
  }

  applyFilter() {
    let result = this.audiences();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.typeAudience?.toLowerCase().includes(term) ||
        a.decision?.toLowerCase().includes(term)
      );
    }
    this.filteredAudiences.set(result);
    this.currentPage = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  createAudience() {
    this.editId.set(0);
    this.tempAudience.set({
      dateAudience: new Date(),
      affaireId: 0,
      typeAudience: '',
      decision: '',
      observation: '',
      commentaire: ''
    });
    this.editMode.set(true);
  }

  editAudience(audience: Audience) {
    this.editId.set(audience.id!);
    this.tempAudience.set({ ...audience });
    this.editMode.set(true);
  }

  saveAudience() {
    const temp = this.tempAudience();
    if (!temp.affaireId || !temp.dateAudience) {
      this.showNotification('Affaire et date sont requis', 'error');
      return;
    }

    const request = this.editId() === 0
      ? this.audienceService.create(temp)
      : this.audienceService.update(this.editId()!, temp);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadAudiences();
        this.cancelEdit();
        this.showNotification('Audience sauvegardée', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  deleteAudience(id: number) {
    if (confirm('Confirmer la suppression de cette audience ?')) {
      this.audienceService.delete(id).subscribe({
        next: () => {
          this.loadAudiences();
          this.showNotification('Audience supprimée', 'success');
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
    this.tempAudience.set({});
    this.editMode.set(false);
  }

  getAffaireRef(affaireId: number): string {
    const affaire = this.affaires().find(a => a.id === affaireId);
    return affaire ? `${affaire.numeroProcedure}` : `#${affaireId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}
