import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  TypeFacture,
  STATUT_FACTURE_LABELS,
  TYPE_FACTURE_LABELS
} from '../../core/models';

import { FactureService } from '../../core/services/facture.service';
import { FactureFormDialogComponent } from './facture-form-dialog';
import { AuthService } from '../../core/services/auth.service';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';

@Component({
  selector: 'app-factures',
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
    MatTooltipModule,
  ],
  templateUrl: './facture.html',
  styleUrls: ['./facture.css'],
})
export class FacturesComponent implements OnInit {

  private factureService = inject(FactureService);
  private snackBar       = inject(MatSnackBar);
  private dialog         = inject(MatDialog);
  readonly authService   = inject(AuthService);  // ── State ──────────────────────────────────────────────────────
  factures         = signal<Facture[]>([]);
  filteredFactures = signal<Facture[]>([]);
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
  statuts: StatutFacture[] = ['EN_ATTENTE_VALIDATION', 'VALIDEE', 'PAYEE', 'REJETEE', 'EN_RETARD'];
  types: TypeFacture[]     = ['HONORAIRES', 'FRAIS', 'EXPERTISE', 'AUTRE'];

  statutLabels = STATUT_FACTURE_LABELS as Record<StatutFacture, string>;
  typeLabels   = TYPE_FACTURE_LABELS   as Record<TypeFacture, string>;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void { this.loadFactures(); }

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

  // ── Filters ────────────────────────────────────────────────────
  applyFilter(): void {
    let result = [...this.factures()];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(f =>
        f.numero?.toLowerCase().includes(q) ||
        f.montant?.toString().includes(q)
      );
    }

    if (this.statusFilter) {
      result = result.filter(f => f.statut === this.statusFilter);
    }

    if (this.typeFilter) {
      result = result.filter(f => f.typeFacture === this.typeFilter);
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
      VALIDEE:              'chip-validee',
      PAYEE:                'chip-payee',
      EN_ATTENTE_VALIDATION:'chip-en_attente',
      REJETEE:              'chip-rejetee',
      EN_RETARD:            'chip-rejetee',
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

  // ── Toggle status ──────────────────────────────────────────────
  toggleStatus(f: Facture): void {
    const newStatus: StatutFacture = f.statut === 'EN_ATTENTE_VALIDATION' ? 'VALIDEE' : 'EN_ATTENTE_VALIDATION';
    this.factureService.updateStatus(f.id!, newStatus).subscribe({
      next: () => { this.snackBar.open('Statut mis à jour', 'OK', { duration: 2500 }); this.loadFactures(); },
      error: () => this.snackBar.open('Erreur lors du changement de statut', 'OK', { duration: 3000 }),
    });
  }

  // ── Soumettre pour validation (ChargeDossier) ──────────────────
  soumettre(f: Facture): void {
    if (!confirm(`Soumettre la facture "${f.numero}" pour validation ?`)) return;
    this.factureService.updateStatus(f.id!, 'EN_ATTENTE_VALIDATION').subscribe({
      next: () => { this.snackBar.open('Facture soumise pour validation', 'OK', { duration: 2500 }); this.loadFactures(); },
      error: () => this.snackBar.open('Erreur lors de la soumission', 'OK', { duration: 3000 }),
    });
  }

  // ── Valider (Responsable) ──────────────────────────────────────
  valider(f: Facture): void {
    if (!confirm(`Valider la facture "${f.numero}" ?`)) return;
    this.factureService.validate(f.id!).subscribe({
      next: () => { this.snackBar.open('Facture validée', 'OK', { duration: 2500 }); this.loadFactures(); },
      error: () => this.snackBar.open('Erreur lors de la validation', 'OK', { duration: 3000 }),
    });
  }

  // ── Rejeter (Responsable) ──────────────────────────────────────
  rejeter(f: Facture): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: 'Rejeter la facture', sousTitre: `Facture : ${f.numero}` }
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null) return;
      this.factureService.reject(f.id!, commentaire || undefined).subscribe({
        next: () => { this.snackBar.open('Facture rejetée', 'OK', { duration: 2500 }); this.loadFactures(); },
        error: () => this.snackBar.open('Erreur lors du rejet', 'OK', { duration: 3000 }),
      });
    });
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
