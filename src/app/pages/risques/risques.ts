import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DrawerPanelComponent
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div>
            <h2>Gestion des Risques</h2>
            <p class="subtitle">{{ filteredRisques().length }} risque(s) trouvé(s)</p>
          </div>
          <button mat-raised-button color="primary" (click)="openDrawer()" *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER')">
            <mat-icon>add</mat-icon> Nouveau Risque
          </button>
        </div>

        @if (risqueService.error()) {
          <div class="error-banner">
            {{ risqueService.error() }}
            <button mat-icon-button (click)="risqueService.clearError()"><mat-icon>close</mat-icon></button>
          </div>
        }

        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="searchTerm" placeholder="Montant, date, dossier...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Dossier</mat-label>
            <mat-select [(ngModel)]="dossierFilter" (selectionChange)="loadData()">
              <mat-option [value]="0">Tous les dossiers</mat-option>
              @for (d of dossiers(); track d.idDossier) {
                <mat-option [value]="d.idDossier">{{ d.reference }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (risqueService.loading()) {
          <div class="loading-container"><mat-spinner diameter="40"></mat-spinner><p>Chargement des risques...</p></div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="filteredRisques()" class="full-width mat-elevation-z2">
              <ng-container matColumnDef="montantPrincipal">
                <th mat-header-cell *matHeaderCellDef>Montant Principal</th>
                <td mat-cell *matCellDef="let r">{{ r.montantPrincipal | number:'1.0-0' }} DH</td>
              </ng-container>
              <ng-container matColumnDef="montantInteret">
                <th mat-header-cell *matHeaderCellDef>Intérêts</th>
                <td mat-cell *matCellDef="let r">{{ r.montantInteret | number:'1.0-0' }} DH</td>
              </ng-container>
              <ng-container matColumnDef="montantTotal">
                <th mat-header-cell *matHeaderCellDef>Montant Total</th>
                <td mat-cell *matCellDef="let r"><strong>{{ r.montantTotal | number:'1.0-0' }} DH</strong></td>
              </ng-container>
              <ng-container matColumnDef="dateContrat">
                <th mat-header-cell *matHeaderCellDef>Date Contrat</th>
                <td mat-cell *matCellDef="let r">{{ r.dateContrat | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="dateEcheance">
                <th mat-header-cell *matHeaderCellDef>Échéance</th>
                <td mat-cell *matCellDef="let r">{{ r.dateEcheance | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="tauxInteret">
                <th mat-header-cell *matHeaderCellDef>Taux</th>
                <td mat-cell *matCellDef="let r">{{ r.tauxInteret }} %</td>
              </ng-container>
              <ng-container matColumnDef="dossierId">
                <th mat-header-cell *matHeaderCellDef>Dossier</th>
                <td mat-cell *matCellDef="let r">{{ getDossierRef(r.dossierId) }}</td>
              </ng-container>
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Référence</th>
                <td mat-cell *matCellDef="let r"><strong>{{ r.reference || '—' }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let r">
                  <button mat-icon-button color="primary" (click)="editRisque(r)" *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER')"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="deleteRisque(r.id!)" *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER')"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: cols;" class="risque-row"></tr>
            </table>
          </div>
        }

        <div class="table-footer">
          <button mat-stroked-button (click)="refreshData()" [disabled]="risqueService.loading()">
            <mat-icon>refresh</mat-icon> Actualiser
          </button>
        </div>
      </mat-card>
    </div>

    <!-- Drawer -->
    <app-drawer-panel
      [open]="drawerOpen()"
      [title]="editingRisque()?.id ? 'Modifier Risque' : 'Nouveau Risque'"
      icon="warning"
      [saveLabel]="editingRisque()?.id ? 'Sauvegarder' : 'Créer'"
      [saveDisabled]="!tempRisque().montantPrincipal || !tempRisque().dossierId"
      [saving]="risqueService.loading()"
      (closed)="closeDrawer()"
      (saved)="saveRisque()">

      <mat-form-field appearance="outline">
        <mat-label>Dossier *</mat-label>
        <mat-icon matPrefix>folder</mat-icon>
        <input matInput
          [matAutocomplete]="dossierAuto"
          [(ngModel)]="dossierSearchText"
          (ngModelChange)="onDossierSearch($event)"
          placeholder="Tapez la référence du dossier...">
        <mat-autocomplete #dossierAuto="matAutocomplete"
          [displayWith]="displayDossier.bind(this)"
          (optionSelected)="onDossierSelected($event)">
          @for (d of filteredDossierOptions(); track d.idDossier) {
            <mat-option [value]="d">{{ d.reference }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Montant Principal *</mat-label>
        <input matInput type="number" [(ngModel)]="tempRisque().montantPrincipal"
          (ngModelChange)="updateTotal()">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Intérêts</mat-label>
        <input matInput type="number" [(ngModel)]="tempRisque().montantInteret"
          (ngModelChange)="updateTotal()">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Montant Total (calculé automatiquement)</mat-label>
        <input matInput type="number" [value]="calculatedTotal()" readonly
          style="color:#00966E;font-weight:600;cursor:default">
        <mat-icon matSuffix style="color:#00966E">calculate</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Taux d'intérêt (%)</mat-label>
        <input matInput type="number" step="0.1" [(ngModel)]="tempRisque().tauxInteret">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Date Contrat</mat-label>
        <input matInput [matDatepicker]="dateContratPicker" [(ngModel)]="tempRisque().dateContrat">
        <mat-datepicker-toggle matSuffix [for]="dateContratPicker"></mat-datepicker-toggle>
        <mat-datepicker #dateContratPicker></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Date Échéance</mat-label>
        <input matInput [matDatepicker]="dateEcheancePicker" [(ngModel)]="tempRisque().dateEcheance">
        <mat-datepicker-toggle matSuffix [for]="dateEcheancePicker"></mat-datepicker-toggle>
        <mat-datepicker #dateEcheancePicker></mat-datepicker>
      </mat-form-field>
    </app-drawer-panel>
  `,
  styleUrls: ['./risques.css']
})
export class RisquesComponent implements OnInit {
  searchTerm = '';
  dossierFilter = 0;

  displayedColumns: string[] = [
    'reference', 'montantPrincipal', 'montantInteret', 'montantTotal',
    'dateContrat', 'dateEcheance', 'tauxInteret', 'dossierId', 'actions'
  ];

  get cols(): string[] {
    return this.authService.isAdmin()
      ? this.displayedColumns.filter(c => c !== 'actions')
      : this.displayedColumns;
  }

  private sub?: Subscription;

  drawerOpen = signal(false);
  editingRisque = signal<Risque | null>(null);
  tempRisque = signal<RisqueDraft>({} as RisqueDraft);
  dossiers = signal<Dossier[]>([]);

  // ── Autocomplete state for dossier picker ──────────────────────
  dossierSearchText = '';
  filteredDossierOptions = signal<Dossier[]>([]);

  constructor(public risqueService: RisqueService, private snackBar: MatSnackBar, private api: ApiService, public authService: AuthService) {
    effect(() => {
      if (!this.risqueService.loading() && this.risqueService.risques().length === 0) {
        this.loadData();
      }
    });
  }

  ngOnInit() {
    this.loadDossiers();
  }

  loadDossiers() {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => {
        this.dossiers.set(data ?? []);
        this.filteredDossierOptions.set(data ?? []);
      },
      error: () => this.dossiers.set([])
    });
  }

  getDossierRef(dossierId: number): string {
    const d = this.dossiers().find(d => d.idDossier === dossierId);
    return d ? d.reference : `#${dossierId}`;
  }

  loadData() {
    const obs = this.dossierFilter
      ? this.risqueService.getByDossierId(this.dossierFilter)
      : this.risqueService.getAll();
    this.sub = obs.subscribe();
  }

  refreshData() {
    this.loadData();
    this.snackBar.open('Données actualisées', 'OK', { duration: 2000 });
  }

  filteredRisques = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const all = this.risqueService.risques();
    return all.filter(r =>
      r.montantPrincipal.toString().includes(term) ||
      r.montantTotal.toString().includes(term) ||
      r.dossierId.toString().includes(term) ||
      r.tauxInteret.toString().includes(term)
    );
  });

  openDrawer(risque?: Risque) {
    this.editingRisque.set(risque || null);
    this.tempRisque.set(
      risque
        ? ({ ...risque, dossierId: risque.dossierId ?? 0 } as RisqueDraft)
        : { montantPrincipal: 0, montantInteret: 0, tauxInteret: 0, dossierId: 0 }
    );
    // Pre-fill autocomplete text if editing
    if (risque?.dossierId) {
      const d = this.dossiers().find(d => d.idDossier === risque.dossierId);
      this.dossierSearchText = d ? d.reference : '';
    } else {
      this.dossierSearchText = '';
    }
    this.filteredDossierOptions.set(this.dossiers());
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
    this.editingRisque.set(null);
    this.tempRisque.set({} as RisqueDraft);
    this.dossierSearchText = '';
    this.filteredDossierOptions.set([]);
  }

  onDossierSearch(text: string): void {
    const term = (text || '').toLowerCase();
    this.filteredDossierOptions.set(
      this.dossiers().filter(d => d.reference.toLowerCase().includes(term))
    );
    // If text was cleared, reset dossierId
    if (!text) {
      this.tempRisque.set({ ...this.tempRisque(), dossierId: 0 });
    }
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

  calculatedTotal(): number {
    const p = this.tempRisque().montantPrincipal ?? 0;
    const i = this.tempRisque().montantInteret   ?? 0;
    return p + i;
  }

  updateTotal(): void {
    // Triggers re-evaluation of calculatedTotal — no state needed, computed from tempRisque
  }

  editRisque(risque: Risque) {
    this.openDrawer(risque);
  }

  saveRisque() {
    const temp = this.tempRisque();
    const existing = this.editingRisque();

    if (!temp.dossierId) {
      this.snackBar.open('Veuillez sélectionner un dossier', 'OK', { duration: 3000 });
      return;
    }

    const action$ = existing?.id
      ? this.risqueService.update(existing.id, temp)
      : this.risqueService.create(temp);

    action$.subscribe({
      next: () => {
        this.snackBar.open(existing?.id ? 'Risque mis à jour' : 'Risque créé', 'OK', { duration: 3000 });
        this.closeDrawer();
        this.loadData();
      },
      error: (err) => {
        console.error('Save error:', err);
        this.snackBar.open('Erreur sauvegarde', 'OK');
      }
    });
  }

  deleteRisque(id: number) {
    if (confirm('Supprimer ce risque ?')) {
      this.sub = this.risqueService.delete(id).subscribe({
        next: () => this.snackBar.open('Risque supprimé', 'OK', { duration: 2000 }),
        error: (err) => {
          console.error('Delete error:', err);
          this.snackBar.open('Erreur suppression', 'OK');
        }
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

