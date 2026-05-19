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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AudienceService } from '../../core/services/audience.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Audience } from '../../core/models/audience.model';
import { Affaire } from '../../core/models/affaire.model';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

@Component({
  selector: 'app-audiences',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
    DrawerPanelComponent
  ],
  templateUrl: './audiences.html',
  styleUrls: ['./audiences.css']
})
export class AudiencesComponent implements OnInit {
  private audienceService = inject(AudienceService);
  private api             = inject(ApiService);
  private snackBar        = inject(MatSnackBar);
  readonly authService    = inject(AuthService);

  audiences = signal<Audience[]>([]);
  affaires  = signal<Affaire[]>([]);
  loading   = signal(false);

  searchTerm    = '';
  affaireFilter = 0;

  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  editId       = signal<number | null>(null);
  editMode     = signal(false);
  tempAudience = signal<Partial<Audience>>({});

  filteredAudiences = signal<Audience[]>([]);

  ngOnInit(): void {
    this.loadAudiences();
    this.loadAffaires();
  }

  loadAudiences(): void {
    this.loading.set(true);
    this.audienceService.getAll().subscribe({
      next: (data) => { this.audiences.set(data ?? []); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showNotification('Erreur chargement audiences', 'error'); }
    });
  }

  loadAffaires(): void {
    this.api.get<Affaire[]>('/affaires').subscribe({
      next: (data) => this.affaires.set(data ?? []),
      error: () => {}
    });
  }

  applyFilter(): void {
    let r = this.audiences();
    if (this.affaireFilter) r = r.filter(a => a.affaireId === this.affaireFilter);
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      r = r.filter(a => a.typeAudience?.toLowerCase().includes(t) || a.decision?.toLowerCase().includes(t));
    }
    this.filteredAudiences.set(r);
    this.currentPage.set(0);
  }

  pagedAudiences(): Audience[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredAudiences().slice(start, start + this.pageSize());
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredAudiences().length / this.pageSize())); }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void { this.pageSize.set(Number(size)); this.currentPage.set(0); }

  getPageNumbers(): number[] {
    const total = this.totalPages(), current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const start = Math.max(0, current - 2), end = Math.min(total - 1, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  createAudience(): void {
    this.editId.set(0);
    this.tempAudience.set({ dateAudience: new Date(), affaireId: 0, typeAudience: '', decision: '', observation: '', commentaire: '' });
    this.editMode.set(true);
  }

  editAudience(audience: Audience): void {
    this.editId.set(audience.idAudience!);
    this.tempAudience.set({ ...audience });
    this.editMode.set(true);
  }

  saveAudience(): void {
    const temp = this.tempAudience();
    if (!temp.affaireId || !temp.dateAudience) { this.showNotification('Affaire et date sont requis', 'error'); return; }
    const req = this.editId() === 0 ? this.audienceService.create(temp) : this.audienceService.update(this.editId()!, temp);
    this.loading.set(true);
    req.subscribe({
      next: () => { this.loading.set(false); this.loadAudiences(); this.cancelEdit(); this.showNotification('Audience sauvegardée', 'success'); },
      error: () => { this.loading.set(false); this.showNotification('Erreur sauvegarde', 'error'); }
    });
  }

  deleteAudience(id: number): void {
    if (!confirm('Confirmer la suppression de cette audience ?')) return;
    this.audienceService.delete(id).subscribe({
      next: () => { this.loadAudiences(); this.showNotification('Audience supprimée', 'success'); },
      error: () => this.showNotification('Erreur suppression', 'error')
    });
  }

  cancelEdit(): void { this.editId.set(null); this.tempAudience.set({}); this.editMode.set(false); }

  getAffaireRef(affaireId: number): string {
    const a = this.affaires().find(a => a.idAffaire === affaireId);
    return a ? a.numeroProcedure : `#${affaireId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar' });
  }
}
