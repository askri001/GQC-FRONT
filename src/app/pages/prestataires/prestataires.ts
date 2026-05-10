import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PrestataireService } from '../../core/services/prestataire.service';
import { Prestataire, TypePrestataire } from '../../core/models/prestataire.model';
import { PrestataireFormDialogComponent } from './prestataire-form-dialog';
import { ConfirmPrestataireStatusDialogComponent } from './confirm-status-dialog';
import { AuthService } from '../../core/services/auth.service';

// ── Tab definition ─────────────────────────────────────────────
export interface TabDef {
  type:  TypePrestataire;
  label: string;
  icon:  string;
}

@Component({
  selector: 'app-prestataires',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './prestataire.html',
  styleUrls:   ['./prestataire.css'],
})
export class PrestatairesComponent implements OnInit {

  private prestataireService = inject(PrestataireService);
  private snackBar           = inject(MatSnackBar);
  private dialog             = inject(MatDialog);
  private cdr                = inject(ChangeDetectorRef);
  readonly authService       = inject(AuthService);

  // ── Tabs config ────────────────────────────────────────────────
  readonly tabs: TabDef[] = [
    { type: 'AVOCAT',   label: 'Avocats',   icon: 'gavel'   },
    { type: 'HUISSIER', label: 'Huissiers', icon: 'balance' },
    { type: 'EXPERT',   label: 'Experts',   icon: 'science' },
  ];

  activeTab = signal<TypePrestataire>('AVOCAT');

  // ── Per-tab state ──────────────────────────────────────────────
  tabState: Record<TypePrestataire, {
    rows:    Prestataire[];
    total:   number;
    page:    number;
    size:    number;
    search:  string;
    status:  string;
    loading: boolean;
    error:   string | null;
  }> = {
    AVOCAT:   this.initTabState(),
    HUISSIER: this.initTabState(),
    EXPERT:   this.initTabState(),
  };

  allPrestataires = signal<Prestataire[]>([]);
  togglingId      = signal<number | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadTab('AVOCAT');
    this.loadAllForDialog();
  }

  // ── Helpers ────────────────────────────────────────────────────
  private initTabState() {
    return { rows: [], total: 0, page: 0, size: 10, search: '', status: '', loading: false, error: null };
  }

  get current() { return this.tabState[this.activeTab()]; }

  // ── Tab switch ─────────────────────────────────────────────────
  selectTab(type: TypePrestataire): void {
    if (this.activeTab() === type) return;
    this.activeTab.set(type);
    if (this.tabState[type].rows.length === 0 && !this.tabState[type].loading) {
      this.loadTab(type);
    }
  }

  // ── Load data ──────────────────────────────────────────────────
  loadTab(type: TypePrestataire): void {
    const s = this.tabState[type];
    s.loading = true;
    s.error   = null;

    const status = s.status === '' ? undefined : s.status === 'true';
    const search = s.search?.trim() || undefined;

    this.prestataireService
      .getPaginated(s.page, s.size, search, type, status)
      .pipe(finalize(() => {
        s.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          s.rows  = res.content       ?? [];
          s.total = res.totalElements ?? 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          let msg = 'Erreur lors du chargement';
          if (err?.status === 0)        msg = 'Serveur indisponible';
          else if (err?.status === 403) msg = 'Accès refusé (403)';
          else if (err?.error?.message) msg = err.error.message;
          s.error = msg;
          s.rows  = [];
          s.total = 0;
        },
      });
  }

  reloadCurrent(): void { this.loadTab(this.activeTab()); }

  private loadAllForDialog(): void {
    this.prestataireService.getAll().subscribe({
      next: (all) => this.allPrestataires.set(all),
      error: () => {},
    });
  }

  // ── Filters ────────────────────────────────────────────────────
  applyFilters(): void {
    const type = this.activeTab();
    this.tabState[type].page = 0;
    this.loadTab(type);
  }

  // ── Pagination ─────────────────────────────────────────────────
  totalPages(): number {
    const s = this.current;
    return Math.max(1, Math.ceil(s.total / s.size));
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.current.page = page;
    this.loadTab(this.activeTab());
  }

  onPageSizeChange(size: number): void {
    this.current.size = Number(size);
    this.current.page = 0;
    this.loadTab(this.activeTab());
  }

  getPageNumbers(): number[] {
    const total   = this.totalPages();
    const current = this.current.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const start = Math.max(0, current - 2);
    const end   = Math.min(total - 1, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  // ── Dialog: Créer ──────────────────────────────────────────────
  openCreateDialog(): void {
    const activeType = this.activeTab();

    const ref = this.dialog.open(PrestataireFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'prestataire-dialog',
      data: {
        isEdit: false,
        defaultType: activeType,
        existingPrestataires: this.allPrestataires(),
      },
    });

    ref.afterClosed().subscribe((result?: Partial<Prestataire>) => {
      if (!result) return;
      this.prestataireService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Prestataire créé avec succès', 'OK', { duration: 3000 });
          const createdType = (result.typePrestataire ?? activeType) as TypePrestataire;
          this.tabState[createdType].page = 0;
          this.loadTab(createdType);
          this.loadAllForDialog();
          if (createdType !== this.activeTab()) this.activeTab.set(createdType);
        },
        error: () => this.snackBar.open('Erreur lors de la création', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Dialog: Modifier ───────────────────────────────────────────
  openEditDialog(p: Prestataire): void {
    const ref = this.dialog.open(PrestataireFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'prestataire-dialog',
      data: { isEdit: true, prestataire: p, existingPrestataires: this.allPrestataires() },
    });

    ref.afterClosed().subscribe((result?: Partial<Prestataire>) => {
      if (!result) return;
      this.prestataireService.update(p.idPrestataire ?? p.id!, result).subscribe({
        next: () => {
          this.snackBar.open('Prestataire modifié avec succès', 'OK', { duration: 3000 });
          this.loadTab(this.activeTab());
          this.loadAllForDialog();
        },
        error: () => this.snackBar.open('Erreur lors de la modification', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Supprimer ──────────────────────────────────────────────────
  confirmDelete(p: Prestataire): void {
    if (!confirm(`Supprimer "${this.getFullName(p)}" ? Cette action est irréversible.`)) return;
    this.prestataireService.delete(p.idPrestataire ?? p.id!).subscribe({
      next: () => {
        this.snackBar.open('Prestataire supprimé', 'OK', { duration: 2500 });
        this.loadTab(this.activeTab());
        this.loadAllForDialog();
      },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
    });
  }

  // ── Toggle statut ──────────────────────────────────────────────
  toggleStatus(p: Prestataire): void {
    const nextActive = !p.actif;

    const ref = this.dialog.open(ConfirmPrestataireStatusDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      panelClass: 'confirm-status-dialog',
      data: { activate: nextActive, prestataireName: this.getFullName(p) },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.togglingId.set(p.idPrestataire ?? p.id!);

      this.prestataireService
        .updateStatus(p.idPrestataire!, nextActive)
        .pipe(finalize(() => this.togglingId.set(null)))
        .subscribe({
          next: (updated) => {
            const type = this.activeTab();
            this.tabState[type].rows = this.tabState[type].rows.map(item =>
              item.idPrestataire === p.idPrestataire ? { ...item, actif: updated.actif } : item
            );
            const label = nextActive ? 'activé' : 'désactivé';
            this.snackBar.open(`Prestataire ${label} avec succès`, 'OK', { duration: 2500 });
          },
          error: (err) => {
            let msg = 'Erreur lors du changement de statut';
            if (err?.status === 0)        msg = 'Serveur indisponible';
            else if (err?.status === 403) msg = 'Action non autorisée';
            else if (err?.error?.message) msg = err.error.message;
            this.snackBar.open(msg, 'OK', { duration: 3500 });
          },
        });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  getFullName(p: Prestataire): string {
    return p.prenom ? `${p.nom} ${p.prenom}` : p.nom;
  }

  activeTabLabel(): string {
    return this.tabs.find(t => t.type === this.activeTab())?.label.replace(/s$/, '') ?? 'Prestataire';
  }
}
