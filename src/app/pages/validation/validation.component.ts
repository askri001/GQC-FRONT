import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

import {
  Mission,
  STATUT_MISSION_LABELS,
  TYPE_MISSION_LABELS,
  StatutMission,
  TypeMission,
} from '../../core/models/mission.model';
import {
  Facture,
  STATUT_FACTURE_LABELS,
  TYPE_FACTURE_LABELS,
  StatutFacture,
  TypeFacture,
} from '../../core/models/facture.model';

import { MissionService } from '../../core/services/mission.service';
import { FactureService } from '../../core/services/facture.service';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule,
  ],
  templateUrl: './validation.component.html',
  styleUrls: ['./validation.component.css'],
})
export class ValidationComponent implements OnInit {

  private missionService = inject(MissionService);
  private factureService = inject(FactureService);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
  private api            = inject(ApiService);

  // ── Missions EN_COURS ─────────────────────────────────────────
  missions        = signal<Mission[]>([]);
  missionsLoading = signal(false);
  missionsError   = signal<string | null>(null);

  // ── Factures EN_ATTENTE_VALIDATION ────────────────────────────
  factures        = signal<Facture[]>([]);
  facturesLoading = signal(false);
  facturesError   = signal<string | null>(null);

  // ── Lookup ────────────────────────────────────────────────────
  prestataires        = signal<any[]>([]);
  typeMissionLabels   = TYPE_MISSION_LABELS   as Record<TypeMission,   string>;
  statutMissionLabels = STATUT_MISSION_LABELS as Record<StatutMission, string>;
  typeFactureLabels   = TYPE_FACTURE_LABELS   as Record<TypeFacture,   string>;
  statutFactureLabels = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;

  ngOnInit(): void {
    this.loadAll();
    this.api.get<any[]>('/prestataires').subscribe({
      next: (data) => this.prestataires.set(data ?? []),
      error: () => {},
    });
  }

  loadAll(): void {
    this.loadMissions();
    this.loadFactures();
  }

  // ── Load missions EN_COURS ────────────────────────────────────
  loadMissions(): void {
    this.missionsLoading.set(true);
    this.missionsError.set(null);
    this.missionService.getAll()
      .pipe(finalize(() => this.missionsLoading.set(false)))
      .subscribe({
        next: (data) => this.missions.set((data ?? []).filter(m => m.statut === 'EN_COURS')),
        error: () => this.missionsError.set('Erreur lors du chargement des missions'),
      });
  }

  // ── Load factures EN_ATTENTE_VALIDATION ───────────────────────
  loadFactures(): void {
    this.facturesLoading.set(true);
    this.facturesError.set(null);
    this.factureService.getAll()
      .pipe(finalize(() => this.facturesLoading.set(false)))
      .subscribe({
        next: (data) => this.factures.set((data ?? []).filter(f => f.statut === 'EN_ATTENTE_VALIDATION')),
        error: () => this.facturesError.set('Erreur lors du chargement des factures'),
      });
  }

  // ── Mission : Valider → TERMINEE ──────────────────────────────
  validerMission(m: Mission): void {
    if (!confirm(`Valider la mission "${this.typeMissionLabels[m.typeMission]}" ?\nElle passera au statut TERMINÉE.`)) return;
    this.missionService.validate(m.id!).subscribe({
      next: () => {
        this.snackBar.open('✔ Mission validée — TERMINÉE', 'OK', { duration: 3000 });
        this.loadMissions();
      },
      error: () => this.snackBar.open('Erreur lors de la validation', 'OK', { duration: 3000 }),
    });
  }

  // ── Mission : Rejeter → EN_ATTENTE ────────────────────────────
  rejeterMission(m: Mission): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: {
        titre: 'Rejeter la mission',
        sousTitre: `Mission : ${this.typeMissionLabels[m.typeMission]}`,
      },
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null || commentaire === undefined) return;
      this.missionService.reject(m.id!, commentaire || undefined).subscribe({
        next: () => {
          this.snackBar.open('✖ Mission rejetée — renvoyée en attente', 'OK', { duration: 3000 });
          this.loadMissions();
        },
        error: () => this.snackBar.open('Erreur lors du rejet', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Facture : Valider → VALIDEE ───────────────────────────────
  validerFacture(f: Facture): void {
    if (!confirm(`Valider la facture "${f.numero}" ?\nElle passera au statut VALIDÉE.`)) return;
    this.factureService.validate(f.id!).subscribe({
      next: () => {
        this.snackBar.open('✔ Facture validée', 'OK', { duration: 3000 });
        this.loadFactures();
      },
      error: () => this.snackBar.open('Erreur lors de la validation', 'OK', { duration: 3000 }),
    });
  }

  // ── Facture : Rejeter → REJETEE ───────────────────────────────
  rejeterFacture(f: Facture): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: {
        titre: 'Rejeter la facture',
        sousTitre: `Facture N° ${f.numero} — ${f.montant} DT`,
      },
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null || commentaire === undefined) return;
      this.factureService.reject(f.id!, commentaire || undefined).subscribe({
        next: () => {
          this.snackBar.open('✖ Facture rejetée', 'OK', { duration: 3000 });
          this.loadFactures();
        },
        error: () => this.snackBar.open('Erreur lors du rejet', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getPrestataireNom(prestataireId: number | undefined): string {
    if (!prestataireId) return '—';
    const p = this.prestataires().find(p => (p.idPrestataire ?? p.id) === prestataireId);
    return p ? `${p.prenom || ''} ${p.nom || ''}`.trim() : `#${prestataireId}`;
  }

  getMissionStatutClass(statut: StatutMission): string {
    const map: Record<StatutMission, string> = {
      EN_ATTENTE:            'badge-attente',
      EN_COURS:              'badge-encours',
      EN_ATTENTE_VALIDATION: 'badge-validation',
      TERMINEE:              'badge-termine',
      ANNULEE:               'badge-annule',
    };
    return map[statut] ?? '';
  }

  getFactureStatutClass(statut: StatutFacture): string {
    const map: Record<StatutFacture, string> = {
      EN_ATTENTE_VALIDATION: 'badge-validation',
      VALIDEE:               'badge-valide',
      REJETEE:               'badge-rejete',
      PAYEE:                 'badge-paye',
    };
    return map[statut] ?? '';
  }
}
