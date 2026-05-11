import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  Mission,
  StatutMission,
  TypeMission,
  STATUT_MISSION_LABELS,
  TYPE_MISSION_LABELS,
} from '../../core/models';

import { MissionService } from '../../core/services/mission.service';
import { MissionFormDialogComponent } from './mission-form-dialog';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.css'],
})
export class MissionsComponent implements OnInit {

  private missionService = inject(MissionService);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
  readonly authService   = inject(AuthService);

  // ── State ──────────────────────────────────────────────────────
  missions         = signal<Mission[]>([]);
  filteredMissions = signal<Mission[]>([]);
  isLoading        = signal(false);
  error            = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────
  searchQuery  = '';
  statusFilter = '';
  typeFilter   = '';

  // ── Pagination ─────────────────────────────────────────────────
  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  // ── Lookup data ────────────────────────────────────────────────
  statuts: StatutMission[] = ['EN_ATTENTE', 'EN_COURS', 'EN_ATTENTE_VALIDATION', 'TERMINEE', 'ANNULEE'];
  types: TypeMission[]     = ['HUISSIER', 'EXPERT'];

  statutLabels = STATUT_MISSION_LABELS as Record<StatutMission, string>;
  typeLabels   = TYPE_MISSION_LABELS   as Record<TypeMission, string>;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void { this.loadMissions(); }

  // ── Load ───────────────────────────────────────────────────────
  loadMissions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.missionService.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.missions.set(data || []);
          this.applyFilter();
        },
        error: (err) => {
          let msg = 'Erreur lors du chargement des missions';
          if (err?.status === 0)        msg = 'Serveur indisponible';
          else if (err?.status === 403) msg = 'Accès refusé (403)';
          else if (err?.error?.message) msg = err.error.message;
          this.error.set(msg);
          this.missions.set([]);
          this.filteredMissions.set([]);
        },
      });
  }

  // ── Filters ────────────────────────────────────────────────────
  applyFilter(): void {
    let result = [...this.missions()];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(m =>
        m.typeMission?.toLowerCase().includes(q) ||
        m.resultat?.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      result = result.filter(m => m.statut === this.statusFilter);
    }

    if (this.typeFilter) {
      result = result.filter(m => m.typeMission === this.typeFilter);
    }

    this.filteredMissions.set(result);
    this.currentPage.set(0);
  }

  // ── Pagination ─────────────────────────────────────────────────
  pagedMissions(): Mission[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredMissions().slice(start, start + this.pageSize());
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMissions().length / this.pageSize()));
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(0);
  }

  getPageNumbers(): number[] {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const start = Math.max(0, current - 2);
    const end   = Math.min(total - 1, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  // ── Status chip CSS class ──────────────────────────────────────
  getStatutClass(statut: StatutMission): string {
    const map: Record<StatutMission, string> = {
      TERMINEE:              'chip-active',
      EN_COURS:              'chip-en_cours',
      EN_ATTENTE:            'chip-en_attente',
      EN_ATTENTE_VALIDATION: 'chip-validation',
      ANNULEE:               'chip-inactive',
    };
    return map[statut] ?? '';
  }

  // ── Dialog: Create ─────────────────────────────────────────────
  openAddDialog(): void {
    const ref = this.dialog.open(MissionFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'mission-dialog',
      data: { isEdit: false },
    });

    ref.afterClosed().subscribe((result?: Partial<Mission>) => {
      if (!result) return;
      this.missionService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Mission créée avec succès', 'OK', { duration: 3000 });
          this.loadMissions();
        },
        error: () => this.snackBar.open('Erreur lors de la création', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Dialog: Edit ───────────────────────────────────────────────
  openEditDialog(m: Mission): void {
    const ref = this.dialog.open(MissionFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'mission-dialog',
      data: { mission: m, isEdit: true },
    });

    ref.afterClosed().subscribe((result?: Partial<Mission>) => {
      if (!result) return;
      this.missionService.update(m.id!, result).subscribe({
        next: () => {
          this.snackBar.open('Mission modifiée avec succès', 'OK', { duration: 3000 });
          this.loadMissions();
        },
        error: () => this.snackBar.open('Erreur lors de la modification', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Toggle status ──────────────────────────────────────────────
  toggleStatus(m: Mission): void {
    // Workflow: EN_ATTENTE → EN_COURS → (edit dialog for TERMINEE) | ANNULEE
    if (m.statut === 'TERMINEE' || m.statut === 'ANNULEE') return;
    const next: StatutMission = m.statut === 'EN_ATTENTE' ? 'EN_COURS' : 'EN_COURS';
    // For EN_COURS → TERMINEE, open edit dialog so résultat can be entered
    if (m.statut === 'EN_COURS') {
      this.openEditDialog(m);
      return;
    }
    this.missionService.updateStatus(m.id!, next).subscribe({
      next: () => {
        this.snackBar.open('Statut mis à jour', 'OK', { duration: 2500 });
        this.loadMissions();
      },
      error: () => this.snackBar.open('Erreur lors du changement de statut', 'OK', { duration: 3000 }),
    });
  }

  // ── Annuler mission ────────────────────────────────────────────
  annulerMission(m: Mission): void {
    if (!confirm(`Annuler la mission "${this.typeLabels[m.typeMission]}" ?`)) return;
    this.missionService.updateStatus(m.id!, 'ANNULEE').subscribe({
      next: () => { this.snackBar.open('Mission annulée', 'OK', { duration: 2500 }); this.loadMissions(); },
      error: () => this.snackBar.open('Erreur lors de l\'annulation', 'OK', { duration: 3000 }),
    });
  }

  // ── Soumettre pour validation (ChargeDossier) ──────────────────
  soumettre(m: Mission): void {
    if (!confirm(`Soumettre la mission pour validation ?`)) return;
    this.missionService.updateStatus(m.id!, 'EN_ATTENTE_VALIDATION').subscribe({
      next: () => { this.snackBar.open('Mission soumise pour validation', 'OK', { duration: 2500 }); this.loadMissions(); },
      error: () => this.snackBar.open('Erreur lors de la soumission', 'OK', { duration: 3000 }),
    });
  }

  // ── Valider (Responsable) ──────────────────────────────────────
  valider(m: Mission): void {
    if (!confirm(`Valider cette mission ?`)) return;
    this.missionService.validate(m.id!).subscribe({
      next: () => { this.snackBar.open('Mission validée', 'OK', { duration: 2500 }); this.loadMissions(); },
      error: () => this.snackBar.open('Erreur lors de la validation', 'OK', { duration: 3000 }),
    });
  }

  // ── Rejeter (Responsable) ──────────────────────────────────────
  rejeter(m: Mission): void {
    if (!confirm(`Rejeter cette mission ? Elle sera renvoyée en cours.`)) return;
    this.missionService.reject(m.id!).subscribe({
      next: () => { this.snackBar.open('Mission rejetée — renvoyée en cours', 'OK', { duration: 2500 }); this.loadMissions(); },
      error: () => this.snackBar.open('Erreur lors du rejet', 'OK', { duration: 3000 }),
    });
  }

  // ── Delete ─────────────────────────────────────────────────────
  confirmDelete(m: Mission): void {
    if (!confirm(`Supprimer la mission "${this.typeLabels[m.typeMission]}" ? Cette action est irréversible.`)) return;
    this.missionService.delete(m.id!).subscribe({
      next: () => {
        this.snackBar.open('Mission supprimée', 'OK', { duration: 2500 });
        this.loadMissions();
      },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
    });
  }
}
