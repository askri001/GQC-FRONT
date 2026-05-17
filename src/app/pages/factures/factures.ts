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
  Facture,
  StatutFacture,
  TypePaiement,
  STATUT_FACTURE_LABELS,
  TYPE_PAIEMENT_LABELS,
} from '../../core/models';

import { FactureService } from '../../core/services/facture.service';
import { FacturePdfService } from '../../core/services/facture-pdf.service';
import { FactureFormDialogComponent } from './facture-form-dialog';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Mission, TYPE_MISSION_LABELS } from '../../core/models/mission.model';
import { Affaire } from '../../core/models/affaire.model';
import { Prestataire } from '../../core/models/prestataire.model';
import { PrestataireService } from '../../core/services/prestataire.service';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import { extractErrorMessage } from '../../core/utils/error.utils';

@Component({
  selector: 'app-factures',
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
  templateUrl: './facture.html',
  styleUrls: ['./facture.css'],
})
export class FacturesComponent implements OnInit {

  private factureService    = inject(FactureService);
  private facturePdfService = inject(FacturePdfService);
  private prestataireService = inject(PrestataireService);
  private snackBar          = inject(MatSnackBar);
  private dialog            = inject(MatDialog);
  private api               = inject(ApiService);
  readonly authService      = inject(AuthService);

  // ── State ──────────────────────────────────────────────────────
  factures         = signal<Facture[]>([]);
  filteredFactures = signal<Facture[]>([]);
  missions         = signal<Mission[]>([]);
  affaires         = signal<Affaire[]>([]);
  prestataires     = signal<Prestataire[]>([]);
  isLoading        = signal(false);
  error            = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────
  searchQuery    = '';
  statusFilter   = '';
  paiementFilter = '';

  // ── Pagination ─────────────────────────────────────────────────
  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  // ── Lookup data ────────────────────────────────────────────────
  statuts:       StatutFacture[]  = ['EN_ATTENTE_VALIDATION', 'VALIDEE', 'REJETEE', 'PAYEE'];
  typesPaiement: TypePaiement[]   = ['VIREMENT', 'CHEQUE_BCT'];

  statutLabels       = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typePaiementLabels = TYPE_PAIEMENT_LABELS  as Record<TypePaiement, string>;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadFactures();
    this.api.get<Mission[]>('/missions').subscribe({
      next: (data) => this.missions.set(data ?? []),
      error: () => {},
    });
    this.api.get<Affaire[]>('/affaires').subscribe({
      next: (data) => this.affaires.set(data ?? []),
      error: () => {},
    });
    this.prestataireService.getAll().subscribe({
      next: (data) => this.prestataires.set(data ?? []),
      error: () => {},
    });
  }

  // ── Load ───────────────────────────────────────────────────────
  loadFactures(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.factureService.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.factures.set(data || []);
          this.applyFilter();
        },
        error: (err) => {
          let msg = 'Erreur lors du chargement des factures';
          if (err?.status === 0)        msg = 'Serveur indisponible';
          else if (err?.status === 403) msg = 'Accès refusé (403)';
          else if (err?.error?.message) msg = err.error.message;
          this.error.set(msg);
          this.factures.set([]);
          this.filteredFactures.set([]);
        },
      });
  }

  // ── Per-row processing ────────────────────────────────────────
  processingIds = signal<Set<number>>(new Set());
  isProcessing(id: number): boolean { return this.processingIds().has(id); }
  private setProcessing(id: number, v: boolean): void {
    const s = new Set(this.processingIds()); v ? s.add(id) : s.delete(id);
    this.processingIds.set(s);
  }

  // ── Filters ────────────────────────────────────────────────────
  applyFilter(): void {
    let result = [...this.factures()];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(f =>
        f.numero?.toLowerCase().includes(q) ||
        f.montant?.toString().includes(q),
      );
    }

    if (this.statusFilter) {
      result = result.filter(f => f.statut === this.statusFilter);
    }

    if (this.paiementFilter) {
      result = result.filter(f => f.typePaiement === this.paiementFilter);
    }

    this.filteredFactures.set(result);
    this.currentPage.set(0);
  }

  // ── Pagination ─────────────────────────────────────────────────
  pagedFactures(): Facture[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredFactures().slice(start, start + this.pageSize());
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredFactures().length / this.pageSize()));
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
  getStatutClass(statut: StatutFacture): string {
    const map: Record<StatutFacture, string> = {
      EN_ATTENTE_VALIDATION: 'chip-validation',
      VALIDEE:               'chip-validee',
      REJETEE:               'chip-rejetee',
      PAYEE:                 'chip-payee',
    };
    return map[statut] ?? '';
  }

  // ── Dialog: Create ─────────────────────────────────────────────
  openNewFacture(): void {
    const ref = this.dialog.open(FactureFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'facture-dialog',
      data: { isEdit: false },
    });

    ref.afterClosed().subscribe((result?: Partial<Facture>) => {
      if (!result) return;
      this.factureService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Facture créée avec succès', 'OK', { duration: 3000 });
          this.loadFactures();
        },
        error: () => this.snackBar.open('Erreur lors de la création', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Dialog: Edit ───────────────────────────────────────────────
  openEditFacture(f: Facture): void {
    const ref = this.dialog.open(FactureFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'facture-dialog',
      data: { facture: f, isEdit: true },
    });

    ref.afterClosed().subscribe((result?: Partial<Facture>) => {
      if (!result) return;
      this.factureService.update(f.id!, result).subscribe({
        next: () => {
          this.snackBar.open('Facture modifiée avec succès', 'OK', { duration: 3000 });
          this.loadFactures();
        },
        error: () => this.snackBar.open('Erreur lors de la modification', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Valider (Responsable) — EN_ATTENTE_VALIDATION → VALIDEE ───
  valider(f: Facture): void {
    if (!confirm(`Valider la facture "${f.numero}" ?`)) return;
    this.setProcessing(f.id!, true);
    this.factureService.validate(f.id!)
      .pipe(finalize(() => this.setProcessing(f.id!, false)))
      .subscribe({
        next: () => { this.snackBar.open('Facture validee avec succes', 'OK', { duration: 3000 }); this.loadFactures(); },
        error: (err) => this.snackBar.open(extractErrorMessage(err, 'Erreur lors de la validation'), 'OK', { duration: 6000 }),
      });
  }

  // ── Rejeter (Responsable) — EN_ATTENTE_VALIDATION → REJETEE ───
  rejeter(f: Facture): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: 'Rejeter la facture', sousTitre: `Facture N ${f.numero} — ${f.montant} DT` },
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null || commentaire === undefined) return;
      this.setProcessing(f.id!, true);
      this.factureService.reject(f.id!, commentaire || undefined)
        .pipe(finalize(() => this.setProcessing(f.id!, false)))
        .subscribe({
          next: () => { this.snackBar.open('Facture rejetee avec succes', 'OK', { duration: 3000 }); this.loadFactures(); },
          error: (err) => this.snackBar.open(extractErrorMessage(err, 'Erreur lors du rejet'), 'OK', { duration: 6000 }),
        });
    });
  }

  // ── Payer (Responsable) — VALIDEE → PAYEE ─────────────────────
  payer(f: Facture): void {
    if (!confirm(`Marquer la facture "${f.numero}" comme payée ?`)) return;
    this.factureService.payer(f.id!).subscribe({
      next: () => { this.snackBar.open('Facture marquée comme payée', 'OK', { duration: 2500 }); this.loadFactures(); },
      error: () => this.snackBar.open('Erreur lors du paiement', 'OK', { duration: 3000 }),
    });
  }

  // ── Mission label — show dossier reference if available ───────
  getMissionLabel(f: Facture): string {
    if (f.dossierReference) return f.dossierReference;
    if (f.missionId) {
      const m = this.missions().find(m => m.id === f.missionId);
      if (m) return TYPE_MISSION_LABELS[m.typeMission] ?? m.typeMission;
      return `Mission #${f.missionId}`;
    }
    return '';  // empty = not linked
  }

  // ── Affaire label ──────────────────────────────────────────────
  getAffaireLabel(dossierId: number | undefined): string {
    if (!dossierId) return '';  // empty = not linked
    const a = this.affaires().find(a => (a.idAffaire ?? a.id) === dossierId || a.dossierId === dossierId);
    if (!a) return '';
    return a.numeroProcedure
      ? `${a.numeroProcedure}${a.tribunal ? ' — ' + a.tribunal : ''}`
      : `Affaire #${a.idAffaire ?? a.id}`;
  }

  // ── Télécharger PDF — uniquement si PAYEE ─────────────────────
  telechargerPdf(f: Facture): void {
    const clientLabel = [f.clientPrenom, f.clientNom].filter(Boolean).join(' ') || '—';
    this.facturePdfService.generatePdf({
      facture:           f,
      prestataireNom:    f.prestataireNom    ?? '—',
      prestatairePrenom: f.prestatairePrenom ?? '—',
      prestataireType:   f.prestataireType   ?? '—',
      prestataireRib:    f.prestataireRib    ?? '—',
      missionLabel:      f.missionType       ?? this.getMissionLabel(f),
      affaireNumero:     f.affaireNumeroProcedure ?? '—',
      affaireTribunal:   f.affaireTribunal        ?? '—',
      dossierRef:        f.dossierReference        ?? '—',
      clientNom:         clientLabel,
    }).catch(() =>
      this.snackBar.open('Erreur lors de la génération du PDF', 'OK', { duration: 3000 })
    );
  }

  // ── Delete ─────────────────────────────────────────────────────
  confirmDelete(f: Facture): void {
    if (!confirm(`Supprimer la facture "${f.numero}" ? Cette action est irréversible.`)) return;
    this.factureService.delete(f.id!).subscribe({
      next: () => {
        this.snackBar.open('Facture supprimée', 'OK', { duration: 2500 });
        this.loadFactures();
      },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
    });
  }
}
