import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GarantieService } from '../../core/services/garantie.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Garantie, TYPE_GARANTIE_LABELS, STATUT_GARANTIE_LABELS, TypeGarantie, StatutGarantie } from '../../core/models/garantie.model';
import { Risque } from '../../core/models/risque.model';
import { Dossier } from '../../core/models/dossier.model';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

@Component({
  selector: 'app-garanties',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, DrawerPanelComponent
  ],
  templateUrl: './garanties.html',
  styleUrls: ['./garanties.css']
})
export class GarantiesComponent implements OnInit {
  private garantieService = inject(GarantieService);
  private api             = inject(ApiService);
  private snackBar        = inject(MatSnackBar);
  readonly authService    = inject(AuthService);

  garanties = signal<Garantie[]>([]);
  risques   = signal<Risque[]>([]);
  dossiers  = signal<Dossier[]>([]);
  loading   = signal(false);

  searchTerm      = '';
  statutFilter    = '';
  dossierFilter   = 0;
  risqueFilter    = 0;
  drawerDossierId = 0;

  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  editId       = signal<number | null>(null);
  editMode     = signal(false);
  tempGarantie = signal<Partial<Garantie>>({});

  filteredGaranties = signal<Garantie[]>([]);

  ngOnInit(): void {
    this.loadGaranties();
    this.loadRisques();
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => this.dossiers.set(data ?? []),
      error: () => {}
    });
  }

  loadGaranties(): void {
    this.loading.set(true);
    this.garantieService.getAll().subscribe({
      next: (data) => { this.garanties.set(data ?? []); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showNotification('Erreur chargement garanties', 'error'); }
    });
  }

  loadRisques(): void {
    this.api.get<Risque[]>('/risques').subscribe({
      next: (data) => this.risques.set(data ?? []),
      error: () => {}
    });
  }

  applyFilter(): void {
    let r = this.garanties();
    if (this.dossierFilter) {
      const ids = this.risques().filter(r => r.dossierId === this.dossierFilter).map(r => r.id);
      r = r.filter(g => ids.includes(g.risqueId));
    }
    if (this.risqueFilter)  r = r.filter(g => g.risqueId === this.risqueFilter);
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      r = r.filter(g => g.typeGarantie?.toLowerCase().includes(t) || g.description?.toLowerCase().includes(t));
    }
    if (this.statutFilter) r = r.filter(g => g.statut === this.statutFilter);
    this.filteredGaranties.set(r);
    this.currentPage.set(0);
  }

  pagedGaranties(): Garantie[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredGaranties().slice(start, start + this.pageSize());
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredGaranties().length / this.pageSize())); }

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

  drawerRisques(): Risque[] {
    if (!this.drawerDossierId) return this.risques();
    return this.risques().filter(r => r.dossierId === this.drawerDossierId);
  }

  onDrawerDossierChange(): void {
    this.tempGarantie.set({ ...this.tempGarantie(), risqueId: 0 });
  }

  createGarantie(): void {
    this.editId.set(0);
    this.drawerDossierId = 0;
    this.tempGarantie.set({ typeGarantie: undefined, description: '', valeur: 0, statut: 'ACTIVE', risqueId: 0 });
    this.editMode.set(true);
  }

  editGarantie(garantie: Garantie): void {
    this.editId.set(garantie.idGarantie!);
    this.tempGarantie.set({ ...garantie });
    const r = this.risques().find(r => r.id === garantie.risqueId);
    this.drawerDossierId = r?.dossierId ?? 0;
    this.editMode.set(true);
  }

  saveGarantie(): void {
    const temp = this.tempGarantie();
    if (!temp.typeGarantie || !temp.description || !temp.risqueId) {
      this.showNotification('Type, description et risque sont requis', 'error'); return;
    }
    const req = this.editId() === 0
      ? this.garantieService.create(temp)
      : this.garantieService.update(this.editId()!, temp);
    this.loading.set(true);
    req.subscribe({
      next: () => { this.loading.set(false); this.loadGaranties(); this.cancelEdit(); this.showNotification('Garantie sauvegardée', 'success'); },
      error: () => { this.loading.set(false); this.showNotification('Erreur sauvegarde', 'error'); }
    });
  }

  deleteGarantie(id: number): void {
    if (!confirm('Confirmer la suppression de cette garantie ?')) return;
    this.garantieService.delete(id).subscribe({
      next: () => { this.loadGaranties(); this.showNotification('Garantie supprimée', 'success'); },
      error: () => this.showNotification('Erreur suppression', 'error')
    });
  }

  cancelEdit(): void {
    this.editId.set(null);
    this.tempGarantie.set({});
    this.drawerDossierId = 0;
    this.editMode.set(false);
  }

  getTypeLabel(type: string): string { return TYPE_GARANTIE_LABELS[type as TypeGarantie] || type; }
  getStatutLabel(statut: string): string { return STATUT_GARANTIE_LABELS[statut as StatutGarantie] || statut; }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'ACTIVE': 'chip-active', 'REALISEE': 'chip-realisee',
      'EXPIREE': 'chip-expiree', 'INVALIDEE': 'chip-invalidee'
    };
    return map[statut] ?? '';
  }

  getRisqueRef(risqueId: number): string {
    const r = this.risques().find(r => r.id === risqueId);
    return r ? (r.reference || `RSQ-#${risqueId}`) : `#${risqueId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar' });
  }
}
