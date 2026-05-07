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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { RisqueService } from '../../core/services/risque.service';
import { Risque } from '../../core/models';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

type RisqueDraft = Omit<Partial<Risque>, 'dossierId'> & { dossierReference: string };

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
          <button mat-raised-button color="primary" (click)="openDrawer()">
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
                <th mat-header-cell *matHeaderCellDef>Dossier ID</th>
                <td mat-cell *matCellDef="let r">{{ r.dossierId }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let r">
                  <button mat-icon-button color="primary" (click)="editRisque(r)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="deleteRisque(r.id!)"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="risque-row"></tr>
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
      [saveDisabled]="!tempRisque().montantPrincipal || !tempRisque().dossierReference"
      [saving]="risqueService.loading()"
      (closed)="closeDrawer()"
      (saved)="saveRisque()">

      <mat-form-field appearance="outline">
        <mat-label>Référence Dossier *</mat-label>
        <input matInput type="text" [(ngModel)]="tempRisque().dossierReference">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Montant Principal *</mat-label>
        <input matInput type="number" [(ngModel)]="tempRisque().montantPrincipal">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Intérêts</mat-label>
        <input matInput type="number" [(ngModel)]="tempRisque().montantInteret">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Montant Total</mat-label>
        <input matInput type="number" [(ngModel)]="tempRisque().montantTotal">
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

  displayedColumns: string[] = [
    'montantPrincipal',
    'montantInteret',
    'montantTotal',
    'dateContrat',
    'dateEcheance',
    'tauxInteret',
    'dossierId',
    'actions'
  ];

  private sub?: Subscription;

  drawerOpen = signal(false);
  editingRisque = signal<Risque | null>(null);
  tempRisque = signal<RisqueDraft>({} as RisqueDraft);

  constructor(public risqueService: RisqueService, private snackBar: MatSnackBar) {
    effect(() => {
      if (!this.risqueService.loading() && this.risqueService.risques().length === 0) {
        this.loadData();
      }
    });
  }

  ngOnInit() {}

  loadData() {
    this.sub = this.risqueService.getAll().subscribe();
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
        ? ({
            ...risque,
            dossierReference: String((risque as any).dossierId ?? '')
          } as any)
        : {
            montantPrincipal: 0,
            montantInteret: 0,
            montantTotal: 0,
            tauxInteret: 0,
            dossierReference: ''
          }
    );
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
    this.editingRisque.set(null);
    this.tempRisque.set({} as RisqueDraft);
  }

  editRisque(risque: Risque) {
    this.openDrawer(risque);
  }

  /**
   * Note: This drawer currently only validates dossierReference presence.
   * Converting dossierReference -> dossierId should be implemented by loading dossiers.
   */
  saveRisque() {
    const temp = this.tempRisque();
    const existing = this.editingRisque();

    // Temporary compatibility: if dossierReference is numeric, use it as dossierId.
    const dossierId = Number(temp.dossierReference);
    const payload: Partial<Risque> & { dossierId: number } = {
      ...(temp as any),
      dossierId: Number.isFinite(dossierId) ? dossierId : (existing?.dossierId ?? 0)
    };

    const action$ = existing?.id
      ? this.risqueService.update(existing.id, payload)
      : this.risqueService.create(payload);

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

