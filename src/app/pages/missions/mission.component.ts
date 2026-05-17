import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

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
import { ApiService } from '../../core/services/api.service';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import { extractErrorMessage } from '../../core/utils/error.utils';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './mission.component.html',
  styleUrls: ['./mission.component.css'],
})
export class MissionsComponent implements OnInit {

  private missionService = inject(MissionService);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
  private api            = inject(ApiService);
  readonly authService   = inject(AuthService);

  // ── State ──────────────────────────────────────────────────────
  missions         = signal<Mission[]>([]);
  filteredMissions = signal<Mission[]>([]);
  prestataires     = signal<any[]>([]);
  isLoading        = signal(false);
  error            = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────
  searchQuery       = '';
  statusFilter      = '';
  typeFilter        = '';
  prestataireFilter = '';
  dossierFilter     = '';

  // ── Derived filter lists (built after missions load) ───────────
  dossierIds = signal<number[]>([]);

  // ── Pagination ─────────────────────────────────────────────────
  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  // ── Per-row processing ────────────────────────────────────────
  processingIds = signal<Set<number>>(new Set());
  isProcessing(id: number): boolean { return this.processingIds().has(id); }
  private setProcessing(id: number, v: boolean): void {
    const s = new Set(this.processingIds()); v ? s.add(id) : s.delete(id);
    this.processingIds.set(s);
  }

  // ── Lookup data ────────────────────────────────────────────────
  statuts: StatutMission[] = ['EN_COURS', 'EN_ATTENTE_VALIDATION', 'TERMINEE', 'ANNULEE'];
  types: TypeMission[]     = ['EXECUTION', 'EXPERTISE'];

  statutLabels = STATUT_MISSION_LABELS as Record<StatutMission, string>;
  typeLabels   = TYPE_MISSION_LABELS   as Record<TypeMission, string>;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadMissions();
    this.api.get<any[]>('/prestataires').subscribe({
      next: (data) => this.prestataires.set(data ?? []),
      error: () => {}
    });
  }

  // ── Load ───────────────────────────────────────────────────────
  loadMissions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.missionService.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.missions.set(data || []);
          // Build unique dossier IDs for filter dropdown
          const ids = [...new Set((data || []).map(m => m.dossierId).filter((id): id is number => !!id))];
          this.dossierIds.set(ids.sort((a, b) => a - b));
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

    if (this.prestataireFilter) {
      result = result.filter(m => String(m.prestataireId) === this.prestataireFilter);
    }

    if (this.dossierFilter) {
      result = result.filter(m => String(m.dossierId) === this.dossierFilter);
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
      // Préserver le commentaire existant si le nouveau est vide (sécurité supplémentaire)
      if (!result.commentaire?.trim() && m.commentaire) {
        result.commentaire = m.commentaire;
      }
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
    if (m.statut === 'TERMINEE' || m.statut === 'ANNULEE') return;
    if (m.statut === 'EN_COURS') {
      this.openEditDialog(m);
      return;
    }
    const next: StatutMission = 'EN_COURS';
    this.missionService.updateStatus(m.id!, next, m).subscribe({
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
    this.missionService.updateStatus(m.id!, 'ANNULEE', m).subscribe({
      next: () => { this.snackBar.open('Mission annulée', 'OK', { duration: 2500 }); this.loadMissions(); },
      error: () => this.snackBar.open('Erreur lors de l\'annulation', 'OK', { duration: 3000 }),
    });
  }

  // ── Soumettre pour validation (ChargeDossier) ──────────────────
  soumettre(m: Mission): void {
    if (!confirm(`Soumettre la mission pour validation ?`)) return;
    this.missionService.updateStatus(m.id!, 'EN_ATTENTE_VALIDATION', m).subscribe({
      next: () => { this.snackBar.open('Mission soumise pour validation', 'OK', { duration: 2500 }); this.loadMissions(); },
      error: () => this.snackBar.open('Erreur lors de la soumission', 'OK', { duration: 3000 }),
    });
  }

  // ── Valider (Responsable) — EN_ATTENTE_VALIDATION → TERMINEE ──
  valider(m: Mission): void {
    if (!confirm(`Valider la mission "${this.typeLabels[m.typeMission]}" ?`)) return;
    this.setProcessing(m.id!, true);
    this.missionService.validate(m.id!)
      .pipe(finalize(() => this.setProcessing(m.id!, false)))
      .subscribe({
        next: () => { this.snackBar.open('Mission validee avec succes', 'OK', { duration: 3000 }); this.loadMissions(); },
        error: (err) => this.snackBar.open(extractErrorMessage(err, 'Erreur lors de la validation'), 'OK', { duration: 6000 }),
      });
  }

  // ── Rejeter (Responsable) — EN_ATTENTE_VALIDATION → EN_COURS ──
  rejeter(m: Mission): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: 'Rejeter la mission', sousTitre: `Mission : ${this.typeLabels[m.typeMission]}` },
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null || commentaire === undefined) return;
      this.setProcessing(m.id!, true);
      this.missionService.reject(m.id!, commentaire || undefined)
        .pipe(finalize(() => this.setProcessing(m.id!, false)))
        .subscribe({
          next: () => { this.snackBar.open('Mission rejetee avec succes', 'OK', { duration: 3000 }); this.loadMissions(); },
          error: (err) => this.snackBar.open(extractErrorMessage(err, 'Erreur lors du rejet'), 'OK', { duration: 6000 }),
        });
    });
  }

  // ── Lookup helpers ─────────────────────────────────────────────
  getPrestataireNom(prestataireId: number | undefined): string {
    if (!prestataireId) return '—';
    const p = this.prestataires().find(p => (p.idPrestataire ?? p.id) === prestataireId);
    return p ? `${p.prenom || ''} ${p.nom || ''}`.trim() : `#${prestataireId}`;
  }

  // ── Delete ─────────────────────────────────────────────────────
  confirmDelete(m: Mission): void {
    if (m.statut === 'EN_COURS' || m.statut === 'EN_ATTENTE_VALIDATION') {
      this.snackBar.open('Impossible de supprimer une mission en cours de traitement.', 'OK', { duration: 3500 });
      return;
    }
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
