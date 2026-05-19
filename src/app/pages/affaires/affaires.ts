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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AffaireService } from '../../core/services/affaire.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';
import { Affaire, STATUT_AFFAIRE_LABELS } from '../../core/models/affaire.model';
import { Dossier } from '../../core/models/dossier.model';

interface PrestataireRef { id: number; nom: string; prenom: string; type: string; }

@Component({
  selector: 'app-affaires',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
    MatTooltipModule, MatDialogModule, DrawerPanelComponent
  ],
  templateUrl: './affaires.html',
  styleUrls: ['./affaires.css']
})
export class AffairesComponent implements OnInit {
  private affaireService = inject(AffaireService);
  private api            = inject(ApiService);
  private snackBar       = inject(MatSnackBar);
  readonly authService   = inject(AuthService);
  private dialog         = inject(MatDialog);
  private messageService = inject(MessageService);

  affaires     = signal<Affaire[]>([]);
  dossiers     = signal<Dossier[]>([]);
  prestataires = signal<PrestataireRef[]>([]);
  loading      = signal(false);

  searchTerm   = '';
  statutFilter = '';
  dossierFilter = 0;

  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  editId      = signal<number | null>(null);
  editMode    = signal(false);
  tempAffaire = signal<Partial<Affaire>>({});

  filteredAffaires = signal<Affaire[]>([]);

  ngOnInit(): void {
    this.loadAffaires();
    this.loadDossiers();
    this.loadPrestataires();
  }

  loadAffaires(): void {
    this.loading.set(true);
    const obs = this.dossierFilter
      ? this.affaireService.getByDossierId(this.dossierFilter)
      : this.affaireService.getAll();
    obs.subscribe({
      next: (data) => { this.affaires.set(data ?? []); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showNotification('Erreur chargement affaires', 'error'); }
    });
  }

  loadDossiers(): void {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => this.dossiers.set(data ?? []),
      error: () => {}
    });
  }

  loadPrestataires(): void {
    this.api.get<PrestataireRef[]>('/prestataires').subscribe({
      next: (data) => this.prestataires.set(data ?? []),
      error: () => {}
    });
  }

  applyFilter(): void {
    let r = this.affaires();
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      r = r.filter(a => a.numeroProcedure?.toLowerCase().includes(t) || a.tribunal?.toLowerCase().includes(t));
    }
    if (this.statutFilter) r = r.filter(a => a.statut === this.statutFilter);
    this.filteredAffaires.set(r);
    this.currentPage.set(0);
  }

  pagedAffaires(): Affaire[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredAffaires().slice(start, start + this.pageSize());
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredAffaires().length / this.pageSize())); }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(0);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages(), current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const start = Math.max(0, current - 2), end = Math.min(total - 1, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  showActions(): boolean {
    return this.authService.hasRole('ROLE_CHARGEDOSSIER') || this.authService.hasRole('ROLE_RESPONSABLE');
  }

  createAffaire(): void {
    this.editId.set(0);
    this.tempAffaire.set({ numeroProcedure: '', tribunal: '', statut: 'INITIEE', dossierId: 0, dateDebut: new Date() });
    this.editMode.set(true);
  }

  editAffaire(affaire: Affaire): void {
    this.editId.set(affaire.idAffaire!);
    this.tempAffaire.set({ ...affaire });
    this.editMode.set(true);
  }

  saveAffaire(): void {
    const temp = this.tempAffaire();
    if (!temp.numeroProcedure || !temp.tribunal || !temp.dossierId) {
      this.showNotification('N° procédure, tribunal et dossier sont requis', 'error'); return;
    }
    const req = this.editId() === 0 ? this.affaireService.create(temp) : this.affaireService.update(this.editId()!, temp);
    this.loading.set(true);
    req.subscribe({
      next: () => { this.loading.set(false); this.loadAffaires(); this.cancelEdit(); this.showNotification('Affaire sauvegardée', 'success'); },
      error: () => { this.loading.set(false); this.showNotification('Erreur sauvegarde', 'error'); }
    });
  }

  cancelEdit(): void { this.editId.set(null); this.tempAffaire.set({}); this.editMode.set(false); }

  deleteAffaire(id: number): void {
    if (!confirm('Confirmer la suppression de cette affaire ?')) return;
    this.affaireService.delete(id).subscribe({
      next: () => { this.loadAffaires(); this.showNotification('Affaire supprimée', 'success'); },
      error: () => this.showNotification('Erreur suppression', 'error')
    });
  }

  soumettre(a: Affaire): void {
    if (!confirm(`Soumettre l'affaire "${a.numeroProcedure}" pour validation ?`)) return;
    this.affaireService.update(a.idAffaire!, { ...a, statut: 'EN_ATTENTE_VALIDATION' }).subscribe({
      next: () => { this.loadAffaires(); this.showNotification('Affaire soumise pour validation', 'success'); },
      error: () => this.showNotification('Erreur lors de la soumission', 'error')
    });
  }

  valider(a: Affaire): void {
    if (!confirm(`Valider l'affaire "${a.numeroProcedure}" ?`)) return;
    this.affaireService.validate(a.idAffaire!).subscribe({
      next: () => { this.loadAffaires(); this.showNotification('Affaire validée', 'success'); },
      error: () => this.showNotification('Erreur lors de la validation', 'error')
    });
  }

  rejeter(a: Affaire): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: "Rejeter l'affaire", sousTitre: `Affaire : ${a.numeroProcedure}` }
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null) return;
      this.affaireService.reject(a.idAffaire!, commentaire || undefined).subscribe({
        next: () => {
          this.loadAffaires();
          this.showNotification('Affaire rejetée', 'success');
          const dossier = this.dossiers().find(d => d.idDossier === a.dossierId);
          if (dossier?.chargeDossierId) {
            this.messageService.send({
              toUserId: dossier.chargeDossierId,
              subject: `Affaire rejetée : ${a.numeroProcedure}`,
              body: commentaire || 'Votre affaire a été rejetée.',
              entityType: 'AFFAIRE', entityId: a.idAffaire,
            }).subscribe();
          }
        },
        error: () => this.showNotification('Erreur lors du rejet', 'error')
      });
    });
  }

  getStatutLabel(statut: string): string { return STATUT_AFFAIRE_LABELS[statut as keyof typeof STATUT_AFFAIRE_LABELS] || statut; }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'INITIEE': 'chip-initiee', 'EN_COURS': 'chip-en_cours',
      'JUGEMENT_RENDU': 'chip-jugement', 'EN_ATTENTE_VALIDATION': 'chip-validation', 'TERMINEE': 'chip-active'
    };
    return map[statut] ?? '';
  }

  getDossierRef(dossierId: number): string {
    const d = this.dossiers().find(d => d.idDossier === dossierId);
    return d ? d.reference : `#${dossierId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar' });
  }
}
