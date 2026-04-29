import { Component, OnInit, inject, signal } from '@angular/core';
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

import { Mission, STATUT_MISSION_LABELS, TYPE_MISSION_LABELS } from '../../../app/core/models';
import type { StatutMission } from '../../../app/core/models';

import { MissionService } from '../../../app/core/services/mission.service';
import { MissionFormDialogComponent } from './mission-form-dialog';

@Component({
  selector: 'app-mission-list',
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
  templateUrl: './mission-list.html',
  styleUrls: ['./mission.css']
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

  statuts: string[] = ['EN_ATTENTE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  types: string[] = ['HUISSIER', 'EXPERT', 'AVOCAT'];

  ngOnInit(): void {
    this.loadMissions();
  }

  loadMissions(): void {
    this.isLoading.set(true);
    
    this.missionService.getAll().subscribe({
      next: (data: Mission[]) => {
        this.missions.set(data || []);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.isLoading.set(false);
        this.showNotification('Erreur lors du chargement des missions', 'error');
      }
    });
  }

  applyFilter(): void {
    let result = [...(this.missions() || [])];

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
    return STATUT_MISSION_LABELS[statut as keyof typeof STATUT_MISSION_LABELS] || statut;
  }

  getTypeLabel(type: string): string {
    return TYPE_MISSION_LABELS[type as keyof typeof TYPE_MISSION_LABELS] || type;
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(MissionFormDialogComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createMission(result);
      }
    });
  }

  openEditDialog(mission: Mission): void {
    const dialogRef = this.dialog.open(MissionFormDialogComponent, {
      width: '600px',
      data: { mission, isEdit: true }
    });

    dialogRef.afterClosed().subscribe((result) => {
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
      this.updateStatus(mission.id!, nextStatut as StatutMission);
    }
  }

  createMission(data: Partial<Mission>): void {
    this.missionService.create(data).subscribe({
      next: (newMission: Mission) => {
        this.missions.update(list => [...list, newMission]);
        this.applyFilter();
        this.showNotification('Mission créée avec succès', 'success');
      },
      error: (error) => {
        this.showNotification('Erreur lors de la création', 'error');
      }
    });
  }

  updateMission(id: number, data: Partial<Mission>): void {
    this.missionService.update(id, data).subscribe({
      next: (updated: Mission) => {
        this.missions.update(list => 
          list.map(m => m.id === id ? { ...m, ...updated } : m)
        );
        this.applyFilter();
        this.showNotification('Mission mise à jour avec succès', 'success');
      },
      error: (error) => {
        this.showNotification('Erreur lors de la mise à jour', 'error');
      }
    });
  }

  updateStatus(id: number, statut: StatutMission): void {
    this.missionService.updateStatus(id, statut).subscribe({
      next: (updated: Mission) => {
        this.missions.update(list => 
          list.map(m => m.id === id ? { ...m, ...updated } : m)
        );
        this.applyFilter();
        this.showNotification('Statut mis à jour avec succès', 'success');
      },
      error: (error) => {
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

