import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { PrestataireService } from '../../core/services/prestataire.service';
import { Prestataire } from '../../core/models/prestataire.model';

@Component({
  selector: 'app-avocats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="page-container">
      <mat-card>
        <div class="card-header">
          <h2>Avocats</h2>
          <button mat-raised-button color="primary" (click)="loadAvocats()">
            <mat-icon>refresh</mat-icon> Actualiser
          </button>
        </div>

        <!-- Filters -->
        <div class="filters">
          <input 
            type="text" 
            [(ngModel)]="search" 
            (keyup.enter)="applyFilters()"
            placeholder="Rechercher par nom, email..."
          />
          <select [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Chargement...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="error">
          <mat-icon>error</mat-icon>
          <p>{{ error() }}</p>
        </div>

        <!-- Table -->
        <div *ngIf="!loading() && !error()" class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Spécialité</th>
                <th>Tarif/jour</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let avocat of avocats()">
                <td>{{ avocat.nom }}</td>
                <td>{{ avocat.prenom }}</td>
                <td>{{ avocat.email }}</td>
                <td>{{ avocat.telephone }}</td>
                <td>{{ avocat.specialite }}</td>
                <td>{{ avocat.tarifJournalier | number:'1.2-2' }} €</td>
                <td>
                  <span [class.badge-actif]="avocat.actif" [class.badge-inactif]="!avocat.actif">
                    {{ avocat.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <button 
                    mat-icon-button 
                    [disabled]="togglingId() === avocat.idPrestataire"
                    (click)="toggleStatus(avocat)"
                    [title]="avocat.actif ? 'Désactiver' : 'Activer'"
                  >
                    <mat-spinner *ngIf="togglingId() === avocat.idPrestataire" diameter="20"></mat-spinner>
                    <mat-icon *ngIf="togglingId() !== avocat.idPrestataire">
                      {{ avocat.actif ? 'toggle_on' : 'toggle_off' }}
                    </mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <p *ngIf="avocats().length === 0" class="no-data">
            Aucun avocat trouvé
          </p>
        </div>
      </mat-card>
    </div>
  `,
  styleUrls: ['./avocats.css']
})
export class AvocatsComponent implements OnInit {

  private prestataireService = inject(PrestataireService);
  private snackBar = inject(MatSnackBar);

  avocats = signal<Prestataire[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  togglingId = signal<number | null>(null);

  search = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadAvocats();
  }

  loadAvocats(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.statusFilter === '' ? undefined : this.statusFilter === 'true';
    const search = this.search?.trim() || undefined;

    this.prestataireService
      .getPaginated(0, 1000, search, 'AVOCAT', status)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.avocats.set(res.content ?? []);
        },
        error: (err) => {
          let msg = 'Erreur lors du chargement';
          if (err?.status === 0) msg = 'Serveur indisponible';
          else if (err?.status === 403) msg = 'Accès refusé';
          else if (err?.error?.message) msg = err.error.message;
          this.error.set(msg);
        },
      });
  }

  applyFilters(): void {
    this.loadAvocats();
  }

  // ✅ Status toggle — uses the fixed updateStatus endpoint
  toggleStatus(avocat: Prestataire): void {
    const nextActive = !avocat.actif;
    const action = nextActive ? 'activer' : 'désactiver';

    if (!confirm(`Voulez-vous ${action} ${avocat.prenom} ${avocat.nom} ?`)) {
      return;
    }

    this.togglingId.set(avocat.idPrestataire!);

    this.prestataireService
      .updateStatus(avocat.idPrestataire!, nextActive)
      .pipe(finalize(() => this.togglingId.set(null)))
      .subscribe({
        next: (updated) => {
          // Update local state
          this.avocats.update(list =>
            list.map(a => a.idPrestataire === avocat.idPrestataire ? updated : a)
          );
          const label = nextActive ? 'activé' : 'désactivé';
          this.snackBar.open(`Avocat ${label} avec succès`, 'OK', { duration: 2500 });
        },
        error: (err) => {
          let msg = 'Erreur lors du changement de statut';
          if (err?.status === 0) msg = 'Serveur indisponible';
          else if (err?.status === 403) msg = 'Action non autorisée';
          else if (err?.error?.message) msg = err.error.message;
          this.snackBar.open(msg, 'OK', { duration: 3500 });
        },
      });
  }
}
