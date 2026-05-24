import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { RisqueService } from '../../core/services/risque.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Risque } from '../../core/models';
import { Dossier } from '../../core/models/dossier.model';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

type RisqueDraft = Partial<Risque> & { dossierId: number };

@Component({
  selector: 'app-risques',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatAutocompleteModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    DrawerPanelComponent
  ],
  templateUrl: './risques.html',
  styleUrls: ['./risques.css']
})
export class RisquesComponent implements OnInit {
  public risqueService = inject(RisqueService);
  private api          = inject(ApiService);
  public authService   = inject(AuthService);
  private snackBar     = inject(MatSnackBar);

  searchTerm    = '';
  dossierFilter = 0;

  private sub?: Subscription;

  drawerOpen             = signal(false);
  editingRisque          = signal<Risque | null>(null);
  tempRisque             = signal<RisqueDraft>({} as RisqueDraft);
  dossiers               = signal<Dossier[]>([]);
  dossierSearchText      = '';
  filteredDossierOptions = signal<Dossier[]>([]);

  constructor() {
    effect(() => {
      if (!this.risqueService.loading() && this.risqueService.risques().length === 0) {
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => { this.dossiers.set(data ?? []); this.filteredDossierOptions.set(data ?? []); },
      error: () => this.dossiers.set([])
    });
  }

  loadData(): void {
    const obs = this.dossierFilter
      ? this.risqueService.getByDossierId(this.dossierFilter)
      : this.risqueService.getAll();
    this.sub = obs.subscribe();
  }

  filteredRisques = computed(() => {
    const term = this.searchTerm.toLowerCase();
    return this.risqueService.risques().filter(r =>
      !term ||
      r.montantPrincipal?.toString().includes(term) ||
      r.montantTotal?.toString().includes(term) ||
      r.dossierId?.toString().includes(term) ||
      r.reference?.toLowerCase().includes(term)
    );
  });

  getDossierRef(dossierId: number): string {
    const d = this.dossiers().find(d => d.idDossier === dossierId);
    return d ? d.reference : `#${dossierId}`;
  }

  openDrawer(risque?: Risque): void {
    this.editingRisque.set(risque || null);
    this.tempRisque.set(
      risque
        ? ({ ...risque, dossierId: risque.dossierId ?? 0 } as RisqueDraft)
        : { montantPrincipal: 0, montantInteret: 0, tauxInteret: 0, dossierId: 0 }
    );
    if (risque?.dossierId) {
      const d = this.dossiers().find(d => d.idDossier === risque.dossierId);
      this.dossierSearchText = d ? d.reference : '';
    } else {
      this.dossierSearchText = '';
    }
    this.filteredDossierOptions.set(this.dossiers());
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingRisque.set(null);
    this.tempRisque.set({} as RisqueDraft);
    this.dossierSearchText = '';
    this.filteredDossierOptions.set([]);
  }

  onDossierSearch(text: string): void {
    const term = (text || '').toLowerCase();
    this.filteredDossierOptions.set(this.dossiers().filter(d => d.reference.toLowerCase().includes(term)));
    if (!text) this.tempRisque.set({ ...this.tempRisque(), dossierId: 0 });
  }

  onDossierSelected(event: any): void {
    const dossier: Dossier = event.option.value;
    this.tempRisque.set({ ...this.tempRisque(), dossierId: dossier.idDossier! });
    this.dossierSearchText = dossier.reference;
  }

  displayDossier(dossier: Dossier | string): string {
    if (!dossier) return '';
    if (typeof dossier === 'string') return dossier;
    return dossier.reference || '';
  }

  calculatedInteret(): number {
    const principal = this.tempRisque().montantPrincipal ?? 0;
    const taux      = this.tempRisque().tauxInteret      ?? 0;
    return Math.round(principal * taux / 100 * 100) / 100;
  }

  calculatedTotal(): number {
    return (this.tempRisque().montantPrincipal ?? 0) + this.calculatedInteret();
  }

  recalculate(): void {
    const interet = this.calculatedInteret();
    this.tempRisque.set({
      ...this.tempRisque(),
      montantInteret: interet,
      montantTotal:   (this.tempRisque().montantPrincipal ?? 0) + interet
    });
  }

  updateTotal(): void {}

  editRisque(risque: Risque): void { this.openDrawer(risque); }

  saveRisque(): void {
    const temp     = this.tempRisque();
    const existing = this.editingRisque();
    if (!temp.dossierId) { this.snackBar.open('Veuillez sélectionner un dossier', 'OK', { duration: 3000 }); return; }
    const action$ = existing?.id
      ? this.risqueService.update(existing.id, temp)
      : this.risqueService.create(temp);
    action$.subscribe({
      next: () => { this.snackBar.open(existing?.id ? 'Risque mis à jour' : 'Risque créé', 'OK', { duration: 3000 }); this.closeDrawer(); this.loadData(); },
      error: () => this.snackBar.open('Erreur sauvegarde', 'OK')
    });
  }

  deleteRisque(id: number): void {
    if (!confirm('Supprimer ce risque ?')) return;
    this.risqueService.delete(id).subscribe({
      next: () => this.snackBar.open('Risque supprimé', 'OK', { duration: 2000 }),
      error: () => this.snackBar.open('Erreur suppression', 'OK')
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
