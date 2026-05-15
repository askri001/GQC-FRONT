import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AffaireService } from '../../core/services/affaire.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Affaire, STATUT_AFFAIRE_LABELS } from '../../core/models/affaire.model';
import { Dossier } from '../../core/models/dossier.model';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import { MessageService } from '../../core/services/message.service';

interface PrestataireRef { id: number; nom: string; prenom: string; type: string; }

@Component({
  selector: 'app-affaires',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    DrawerPanelComponent
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">gavel</mat-icon>
            <h2>Gestion des Affaires</h2>
          </div>
          <button mat-raised-button color="primary" (click)="createAffaire()" *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER')">
            <mat-icon>add</mat-icon> Nouvelle Affaire
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()"
              placeholder="Rechercher par N° procédure ou tribunal...">
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Dossier</mat-label>
            <mat-select [(ngModel)]="dossierFilter" (selectionChange)="loadAffaires()">
              <mat-option [value]="0">Tous les dossiers</mat-option>
              @for (d of dossiers(); track d.idDossier) {
                <mat-option [value]="d.idDossier">{{ d.reference }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="statutFilter" (selectionChange)="applyFilter()">
              <mat-option value="">Tous</mat-option>
              <mat-option value="INITIEE">Initiée</mat-option>
              <mat-option value="EN_COURS">En Cours</mat-option>
              <mat-option value="JUGEMENT_RENDU">Jugement Rendu</mat-option>
              <mat-option value="EN_ATTENTE_VALIDATION">En Attente de Validation</mat-option>
              <mat-option value="TERMINEE">Terminée</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        @if (loading()) {
          <div class="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Chargement des affaires...</p>
          </div>
        } @else if (filteredAffaires().length === 0) {
          <div class="no-data">
            <mat-icon>gavel</mat-icon>
            <p>Aucune affaire trouvée</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="pagedAffaires()" class="mat-elevation-z2 full-width">
              <ng-container matColumnDef="numeroProcedure">
                <th mat-header-cell *matHeaderCellDef>N° Procédure</th>
                <td mat-cell *matCellDef="let a">{{ a.numeroProcedure }}</td>
              </ng-container>
              <ng-container matColumnDef="dateDebut">
                <th mat-header-cell *matHeaderCellDef>Date Début</th>
                <td mat-cell *matCellDef="let a">{{ a.dateDebut | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="tribunal">
                <th mat-header-cell *matHeaderCellDef>Tribunal</th>
                <td mat-cell *matCellDef="let a">{{ a.tribunal }}</td>
              </ng-container>
              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let a">
                  <div style="display:flex;align-items:center;gap:6px">
                    <mat-chip [class]="'statut-' + a.statut?.toLowerCase()">{{ getStatutLabel(a.statut) }}</mat-chip>
                    @if (a.commentaireRejet) {
                      <mat-icon style="font-size:16px;width:16px;height:16px;color:#c62828;cursor:help"
                        [matTooltip]="'Rejeté : ' + a.commentaireRejet"
                        matTooltipPosition="right">
                        chat_bubble
                      </mat-icon>
                    }
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="jugement">
                <th mat-header-cell *matHeaderCellDef>Jugement</th>
                <td mat-cell *matCellDef="let a">{{ a.jugement || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="dossier">
                <th mat-header-cell *matHeaderCellDef>Dossier</th>
                <td mat-cell *matCellDef="let a">{{ getDossierRef(a.dossierId) }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let a">
                  <button mat-icon-button color="primary" (click)="editAffaire(a)"
                    *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER') && a.statut !== 'EN_ATTENTE_VALIDATION'"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="accent" (click)="soumettre(a)" title="Soumettre pour validation"
                    *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER') && a.statut === 'JUGEMENT_RENDU'">
                    <mat-icon>send</mat-icon>
                  </button>
                  <button mat-icon-button style="color:#2e7d32" (click)="valider(a)" title="Valider"
                    *ngIf="authService.hasRole('ROLE_RESPONSABLE') && (a.statut === 'EN_ATTENTE_VALIDATION' || a.statut === 'EN_COURS' || a.statut === 'JUGEMENT_RENDU')">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button mat-icon-button style="color:#c62828" (click)="rejeter(a)" title="Rejeter"
                    *ngIf="authService.hasRole('ROLE_RESPONSABLE') && (a.statut === 'EN_ATTENTE_VALIDATION' || a.statut === 'EN_COURS' || a.statut === 'JUGEMENT_RENDU')">
                    <mat-icon>cancel</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteAffaire(a.idAffaire!)" *ngIf="authService.hasRole('ROLE_CHARGEDOSSIER')"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            </table>
            <mat-paginator [length]="filteredAffaires().length" [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25]" (page)="onPageChange($event)"></mat-paginator>
          </div>
        }
      </mat-card>
    </div>

    <!-- Drawer -->
    <app-drawer-panel
      [open]="editMode()"
      [title]="editId() === 0 ? 'Nouvelle Affaire' : 'Modifier Affaire'"
      icon="gavel"
      [saveLabel]="editId() === 0 ? 'Créer' : 'Sauvegarder'"
      [saveDisabled]="!tempAffaire().numeroProcedure || !tempAffaire().tribunal || !tempAffaire().dossierId"
      [saving]="loading()"
      (closed)="cancelEdit()"
      (saved)="saveAffaire()">

      <mat-form-field appearance="outline">
        <mat-label>Dossier *</mat-label>
        <mat-select [(ngModel)]="tempAffaire().dossierId">
          <mat-option [value]="0" disabled>Sélectionner un dossier</mat-option>
          @for (d of dossiers(); track d.idDossier) {
            <mat-option [value]="d.idDossier">{{ d.reference }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>N° Procédure *</mat-label>
        <input matInput [(ngModel)]="tempAffaire().numeroProcedure">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Date Début</mat-label>
        <input matInput [matDatepicker]="datePicker" [(ngModel)]="tempAffaire().dateDebut">
        <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
        <mat-datepicker #datePicker></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Tribunal *</mat-label>
        <input matInput [(ngModel)]="tempAffaire().tribunal">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Statut</mat-label>
        <mat-select [(ngModel)]="tempAffaire().statut">
          <mat-option value="INITIEE">Initiée</mat-option>
          <mat-option value="EN_COURS">En Cours</mat-option>
          <mat-option value="JUGEMENT_RENDU">Jugement Rendu</mat-option>
          <mat-option value="TERMINEE">Terminée</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Jugement</mat-label>
        <input matInput [(ngModel)]="tempAffaire().jugement">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Prestataire assigné</mat-label>
        <mat-select [(ngModel)]="tempAffaire().prestataireId">
          <mat-option [value]="undefined">Aucun</mat-option>
          @for (p of prestataires(); track p.id) {
            <mat-option [value]="p.id">{{ p.prenom }} {{ p.nom }} ({{ p.type }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </app-drawer-panel>
  `,
  styleUrls: ['./affaires.css']
})
export class AffairesComponent implements OnInit {
  private affaireService = inject(AffaireService);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private messageService = inject(MessageService);

  affaires = signal<Affaire[]>([]);
  dossiers = signal<Dossier[]>([]);
  prestataires = signal<PrestataireRef[]>([]);
  loading = signal(false);

  searchTerm = '';
  statutFilter = '';
  dossierFilter = 0;
  pageSize = 10;
  currentPage = 0;

  editId = signal<number | null>(null);
  editMode = signal(false);
  tempAffaire = signal<Partial<Affaire>>({});

  displayedColumns = ['numeroProcedure', 'dateDebut', 'tribunal', 'statut', 'jugement', 'dossier', 'actions'];

  get cols(): string[] {
    return this.authService.isAdmin()
      ? this.displayedColumns.filter(c => c !== 'actions')
      : this.displayedColumns;
  }

  filteredAffaires = signal<Affaire[]>([]);

  pagedAffaires = () => {
    const start = this.currentPage * this.pageSize;
    return this.filteredAffaires().slice(start, start + this.pageSize);
  };

  ngOnInit() {
    this.loadAffaires();
    this.loadDossiers();
    this.loadPrestataires();
  }

  loadAffaires() {
    this.loading.set(true);
    const obs = this.dossierFilter
      ? this.affaireService.getByDossierId(this.dossierFilter)
      : this.affaireService.getAll();
    obs.subscribe({
      next: (data) => {
        this.affaires.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading affaires', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement affaires', 'error');
      }
    });
  }

  loadDossiers() {
    this.api.get<Dossier[]>('/dossiers').subscribe({
      next: (data) => this.dossiers.set(data),
      error: (err) => console.error('Error loading dossiers', err)
    });
  }

  loadPrestataires() {
    this.api.get<PrestataireRef[]>('/prestataires').subscribe({
      next: (data) => this.prestataires.set(data),
      error: (err) => console.error('Error loading prestataires', err)
    });
  }

  applyFilter() {
    let result = this.affaires();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.numeroProcedure?.toLowerCase().includes(term) ||
        a.tribunal?.toLowerCase().includes(term)
      );
    }
    if (this.statutFilter) {
      result = result.filter(a => a.statut === this.statutFilter);
    }
    this.filteredAffaires.set(result);
    this.currentPage = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  createAffaire() {
    this.editId.set(0);
    this.tempAffaire.set({
      numeroProcedure: '',
      tribunal: '',
      statut: 'INITIEE',
      dossierId: 0,
      dateDebut: new Date()
    });
    this.editMode.set(true);
  }

  editAffaire(affaire: Affaire) {
    this.editId.set(affaire.idAffaire!);
    this.tempAffaire.set({ ...affaire });
    this.editMode.set(true);
  }

  saveAffaire() {
    const temp = this.tempAffaire();
    if (!temp.numeroProcedure || !temp.tribunal || !temp.dossierId) {
      this.showNotification('N° procédure, tribunal et dossier sont requis', 'error');
      return;
    }

    const request = this.editId() === 0
      ? this.affaireService.create(temp)
      : this.affaireService.update(this.editId()!, temp);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadAffaires();
        this.cancelEdit();
        this.showNotification('Affaire sauvegardée', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde', 'error');
      }
    });
  }

  deleteAffaire(id: number) {
    if (confirm('Confirmer la suppression de cette affaire ?')) {
      this.affaireService.delete(id).subscribe({
        next: () => { this.loadAffaires(); this.showNotification('Affaire supprimée', 'success'); },
        error: (err) => { console.error('Delete error', err); this.showNotification('Erreur suppression', 'error'); }
      });
    }
  }

  soumettre(a: Affaire) {
    if (!confirm(`Soumettre l'affaire "${a.numeroProcedure}" pour validation ?`)) return;
    this.affaireService.update(a.idAffaire!, { ...a, statut: 'EN_ATTENTE_VALIDATION' }).subscribe({
      next: () => { this.loadAffaires(); this.showNotification('Affaire soumise pour validation', 'success'); },
      error: () => this.showNotification('Erreur lors de la soumission', 'error')
    });
  }

  valider(a: Affaire) {
    if (!confirm(`Valider l'affaire "${a.numeroProcedure}" ?`)) return;
    this.affaireService.validate(a.idAffaire!).subscribe({
      next: () => { this.loadAffaires(); this.showNotification('Affaire validée', 'success'); },
      error: () => this.showNotification('Erreur lors de la validation', 'error')
    });
  }

  rejeter(a: Affaire) {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: "Rejeter l'affaire", sousTitre: `Affaire : ${a.numeroProcedure}` }
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null) return;
      this.affaireService.reject(a.idAffaire!, commentaire || undefined).subscribe({
        next: () => {
          this.loadAffaires();
          this.showNotification('Affaire rejetée — message envoyé', 'success');
          // Auto-send message — find ChargeDossier from dossier
          const dossier = this.dossiers().find(d => d.idDossier === a.dossierId);
          if (dossier?.chargeDossierId) {
            this.messageService.send({
              toUserId:   dossier.chargeDossierId,
              subject:    `Affaire rejetée : ${a.numeroProcedure}`,
              body:       commentaire || 'Votre affaire a été rejetée. Veuillez la corriger.',
              entityType: 'AFFAIRE',
              entityId:   a.idAffaire,
            }).subscribe();
          }
        },
        error: () => this.showNotification('Erreur lors du rejet', 'error')
      });
    });
  }

  cancelEdit() {
    this.editId.set(null);
    this.tempAffaire.set({});
    this.editMode.set(false);
  }

  getStatutLabel(statut: string): string {
    return STATUT_AFFAIRE_LABELS[statut as keyof typeof STATUT_AFFAIRE_LABELS] || statut;
  }

  getDossierRef(dossierId: number): string {
    const dossier = this.dossiers().find(d => d.idDossier === dossierId);
    return dossier ? dossier.reference : `#${dossierId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }
}
