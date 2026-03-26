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

import { Mission, StatutMission, TypeMission, STATUT_MISSION_LABELS, TYPE_MISSION_LABELS, TYPE_PRESTATAIRE_LABELS } from '../../core/models';
import { MissionService } from '../../core/services/mission.service';
import { MissionFormDialogComponent, MissionFormDialogData } from './mission-form-dialog';

@Component({
  selector: 'app-missions',
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
    MatPaginatorModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">assignment</mat-icon>
            <h2>Gestion des Missions</h2>
          </div>
          <button mat-raised-button color="primary" (click)="openAddDialog()">
            <mat-icon>add</mat-icon>
            Nouvelle Mission
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="searchQuery" (keyup)="applyFilter()" placeholder="Type, résultat...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              @for (statut of statuts; track statut) {
                <mat-option [value]="statut">{{ getStatutLabel(statut) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="typeFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              @for (type of types; track type) {
                <mat-option [value]="type">{{ getTypeLabel(type) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement des missions...</p>
          </div>
        }

        @if (!isLoading()) {
          <div class="table-container">
            <table mat-table [dataSource]="filteredMissions()" class="full-width">
              <ng-container matColumnDef="typeMission">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let m">
                  <mat-chip class="type-chip">{{ getTypeLabel(m.typeMission) }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="dossier">
                <th mat-header-cell *matHeaderCellDef>Dossier</th>
                <td mat-cell *matCellDef="let m">
                  @if (m.dossier) {
                    <span class="dossier-info">
                      <mat-icon class="small-icon">folder</mat-icon>
                      {{ m.dossier.reference }}
                    </span>
                  } @else {
                    <span class="no-data-text">-</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="prestataire">
                <th mat-header-cell *matHeaderCellDef>Prestataire</th>
                <td mat-cell *matCellDef="let m">
                  @if (m.prestataire) {
                    <div class="prestataire-details">
                      <div class="prestataire-main">
                        <mat-icon class="small-icon">person</mat-icon>
                        <span class="prestataire-name">{{ m.prestataire.prenom }} {{ m.prestataire.nom }}</span>
                        <mat-chip class="type-chip-sm">{{ m.prestataire.typePrestataire }}</mat-chip>
                      </div>
                      <div class="prestataire-info-row">
                        <span><mat-icon class="tiny-icon">phone</mat-icon> {{ m.prestataire.telephone }}</span>
                        <span><mat-icon class="tiny-icon">email</mat-icon> {{ m.prestataire.email }}</span>
                      </div>
                      <div class="prestataire-info-row">
                        <span><mat-icon class="tiny-icon">work</mat-icon> {{ m.prestataire.specialite }}</span>
                        <span><mat-icon class="tiny-icon">attach_money</mat-icon> {{ m.prestataire.tarifJournalier }} DT/jour</span>
                      </div>
                    </div>
                  } @else {
                    <span class="no-data-text">-</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="dateDebut">
                <th mat-header-cell *matHeaderCellDef>Date Début</th>
                <td mat-cell *matCellDef="let m">{{ m.dateDebut | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="dateFin">
                <th mat-header-cell *matHeaderCellDef>Date Fin</th>
                <td mat-cell *matCellDef="let m">
                  {{ m.dateFin ? (m.dateFin | date:'dd/MM/yyyy') : '-' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let m">
                  <mat-chip [class]="'statut-chip statut-' + m.statut.toLowerCase()">
                    {{ getStatutLabel(m.statut) }}
                  </mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="resultat">
                <th mat-header-cell *matHeaderCellDef>Résultat</th>
                <td mat-cell *matCellDef="let m">
                  <span class="resultat-text">{{ m.resultat || 'En cours' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let m">
                  <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Options">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="openEditDialog(m)">
                      <mat-icon>edit</mat-icon>
                      <span>Modifier</span>
                    </button>
                    <button mat-menu-item (click)="openStatusDialog(m)">
                      <mat-icon>swap_horiz</mat-icon>
                      <span>Changer le statut</span>
                    </button>
                    <button mat-menu-item (click)="confirmDelete(m)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Supprimer</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="mission-row"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  <mat-icon>inbox</mat-icon>
                  <p>Aucune mission trouvée</p>
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator 
            [length]="filteredMissions().length"
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
      color: #2e7d32;
    }

    .card-header h2 {
      margin: 0;
      color: #2e7d32;
      font-size: 24px;
      font-weight: 500;
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .search-field { flex: 1; min-width: 250px; }
    .filter-field { width: 180px; }

    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }

    .type-chip {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .dossier-info, .prestataire-info {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #2e7d32;
      font-weight: 500;
    }

    .small-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .no-data-text {
      color: #9e9e9e;
    }

    .resultat-text {
      font-size: 13px;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .statut-chip { font-weight: 500; }

    .statut-terminee {
      background: #c8e6c9 !important;
      color: #1b5e20 !important;
    }

    .statut-en_cours {
      background: #b3e5fc !important;
      color: #0277bd !important;
    }

    .statut-en_attente {
      background: #fff3e0 !important;
      color: #ef6c00 !important;
    }

    .statut-annulee {
      background: #ffcdd2 !important;
      color: #c62828 !important;
    }

    .mission-row:hover { background: #f5f5f5; }

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

    .loading-container p { margin-top: 16px; }
    .delete-action { color: #f44336; }
    mat-paginator { margin-top: 20px; }
  `]
})
export class MissionsComponent implements OnInit {
  private missionService = inject(MissionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  missions = signal<Mission[]>([]);
  filteredMissions = signal<Mission[]>([]);
  isLoading = signal<boolean>(false);

  displayedColumns = ['typeMission', 'dossier', 'prestataire', 'dateDebut', 'dateFin', 'statut', 'resultat', 'actions'];

  searchQuery = '';
  statusFilter = '';
  typeFilter = '';

  pageSize = 10;
  currentPage = 0;

  statuts: StatutMission[] = ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  types: TypeMission[] = ['HUISSIER', 'EXPERT', 'AVOCAT'];

  ngOnInit(): void {
    this.loadMissions();
  }

  loadMissions(): void {
    this.isLoading.set(true);
    
    this.missionService.getAll().subscribe({
      next: (data) => {
        this.missions.set(data);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading missions:', error);
        this.isLoading.set(false);
        this.showNotification('Erreur lors du chargement des missions', 'error');
      }
    });
  }

  applyFilter(): void {
    let result = [...this.missions()];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(m => 
        m.typeMission.toLowerCase().includes(query) ||
        (m.resultat && m.resultat.toLowerCase().includes(query))
      );
    }

    if (this.statusFilter) {
      result = result.filter(m => m.statut === this.statusFilter);
    }

    if (this.typeFilter) {
      result = result.filter(m => m.typeMission === this.typeFilter);
    }

    this.filteredMissions.set(result);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getStatutLabel(statut: string): string {
    return STATUT_MISSION_LABELS[statut as StatutMission] || statut;
  }

  getTypeLabel(type: string): string {
    return TYPE_MISSION_LABELS[type as TypeMission] || type;
  }

  getPrestataireTypeLabel(type: string): string {
    return TYPE_PRESTATAIRE_LABELS[type as keyof typeof TYPE_PRESTATAIRE_LABELS] || type;
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(MissionFormDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMission(result);
      }
    });
  }

  openEditDialog(mission: Mission): void {
    const dialogRef = this.dialog.open(MissionFormDialogComponent, {
      width: '500px',
      data: { mission, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateMission(mission.id!, result);
      }
    });
  }

  openStatusDialog(mission: Mission): void {
    const currentStatut = mission.statut;
    const availableStatuts = this.statuts.filter(s => s !== currentStatut);
    const nextStatut = availableStatuts[0];
    
    if (confirm(`Voulez-vous changer le statut de "${this.getStatutLabel(currentStatut)}" à "${this.getStatutLabel(nextStatut)}" ?`)) {
      this.updateStatus(mission.id!, nextStatut);
    }
  }

  createMission(data: Partial<Mission>): void {
    this.missionService.create(data).subscribe({
      next: (newMission) => {
        this.missions.update(list => [...list, newMission]);
        this.applyFilter();
        this.showNotification('Mission créée avec succès', 'success');
      },
      error: (error) => {
        console.error('Error creating mission:', error);
        this.showNotification('Erreur lors de la création', 'error');
      }
    });
  }

  updateMission(id: number, data: Partial<Mission>): void {
    this.missionService.update(id, data).subscribe({
      next: (updated) => {
        this.missions.update(list => 
          list.map(m => m.id === id ? { ...m, ...updated } : m)
        );
        this.applyFilter();
        this.showNotification('Mission mise à jour avec succès', 'success');
      },
      error: (error) => {
        console.error('Error updating mission:', error);
        this.showNotification('Erreur lors de la mise à jour', 'error');
      }
    });
  }

  updateStatus(id: number, statut: StatutMission): void {
    this.missionService.updateStatus(id, statut).subscribe({
      next: (updated) => {
        this.missions.update(list => 
          list.map(m => m.id === id ? { ...m, ...updated } : m)
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

  confirmDelete(mission: Mission): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la mission "${mission.typeMission}" ? Cette action est irréversible.`)) {
      this.deleteMission(mission.id!);
    }
  }

  deleteMission(id: number): void {
    this.missionService.delete(id).subscribe({
      next: () => {
        this.missions.update(list => list.filter(m => m.id !== id));
        this.applyFilter();
        this.showNotification('Mission supprimée avec succès', 'success');
      },
      error: (error) => {
        console.error('Error deleting mission:', error);
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

