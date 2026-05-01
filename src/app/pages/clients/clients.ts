import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatConfirmDialogComponent } from '../../shared/mat-confirm-dialog/mat-confirm-dialog';
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client.model';
import { ClientFormDialogComponent } from './client-form-dialog';
import { AuthService } from '../../core/services/auth.service';
import { MaskPipe } from '../../shared/pipes/mask.pipe';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSelectModule,
    MaskPipe
  ],
  templateUrl: './client.html',
  styleUrls: ['./client.css']
})
export class ClientsComponent implements OnInit {

  private service = inject(ClientService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);

  // ================= STATE =================
  clients = signal<Client[]>([]);
  totalClients = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  pageSize = signal(10);
  currentPage = signal(0);

  search = '';
  typeFilter = '';
  statusFilter = '';
  showFilters = signal(true);

  // ================= PERMISSIONS =================
  canCreate = computed(() =>
    this.auth.isAuthenticated() &&
    (this.auth.hasRole('ADMIN') || this.auth.hasPermission('CLIENT_CREATE'))
  );

  canEdit = computed(() =>
    this.auth.isAuthenticated() &&
    (this.auth.hasRole('ADMIN') || this.auth.hasPermission('CLIENT_UPDATE'))
  );

  canDelete = computed(() =>
    this.auth.isAuthenticated() &&
    (this.auth.hasRole('ADMIN') || this.auth.hasPermission('CLIENT_DELETE'))
  );

  // ================= TABLE =================
  displayedColumns = [
    'identifiant',
    'nom',
    'typeClient',
    'cin',
    'rne',
    'tel',
    'email',
    'active',
    'actions'
  ];

  ngOnInit(): void {
    this.loadClients();
  }

  // ================= LOAD =================
  loadClients(): void {
    this.loading.set(true);
    this.error.set(null);

    const type = this.typeFilter || undefined;

    const status =
      this.statusFilter === ''
        ? undefined
        : this.statusFilter === 'true';

    const searchValue = this.search?.trim()
      ? this.search.trim()
      : undefined;
    console.log('loadClients params:', { page: this.currentPage(), size: this.pageSize(), search: searchValue, type, status });


    this.service.getPaginated(
      this.currentPage(),
      this.pageSize(),
      searchValue,
      type,
      status
    ).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res: any) => {
        this.clients.set(res.content ?? []);
        this.totalClients.set(res.totalElements ?? 0);
      },
      error: (err) => {
        let msg = 'Erreur chargement clients';

        if (err?.status === 0) {
          msg = 'Serveur indisponible (backend down)';
        } else if (err?.status === 403) {
          msg = 'Accès refusé (403) - problème permissions JWT';
        } else if (err?.error?.message) {
          msg = err.error.message;
        }

        this.error.set(msg);
        this.clients.set([]);
        this.totalClients.set(0);
      }
    });
  }

  // ================= PAGINATION =================
  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.currentPage.set(event.pageIndex);
    this.loadClients();
  }

  // ================= CREATE =================
  openNewClient(): void {
    if (!this.canCreate()) {
      this.snack.open('❌ Permission refusée', 'OK', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(ClientFormDialogComponent, {
      width: '600px',
      data: { isEdit: false, existingClients: this.clients() }
    });

    ref.afterClosed().subscribe(res => {
      if (!res) return;

      this.service.create(res).subscribe({
        next: () => {
          this.snack.open('Client créé', 'OK', { duration: 2000 });
          this.loadClients();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Erreur création client';
          this.snack.open(msg, 'OK', { duration: 5000 });
        }
      });
    });
  }

  // ================= EDIT =================
  openEditClient(c: Client): void {
    if (!this.canEdit()) {
      this.snack.open('❌ Permission refusée', 'OK', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(ClientFormDialogComponent, {
      width: '600px',
      data: { client: c, isEdit: true, existingClients: this.clients() }
    });

    ref.afterClosed().subscribe(res => {
      if (!res) return;

      this.service.update(c.id!, res).subscribe({
        next: () => {
          this.snack.open('Client modifié', 'OK', { duration: 2000 });
          this.loadClients();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Erreur modification client';
          this.snack.open(msg, 'OK', { duration: 5000 });
        }
      });
    });
  }

  // ================= DELETE =================
  confirmDelete(c: Client): void {
    if (c.id == null || c.id === undefined) {
      console.error('confirmDelete: client id is undefined', c);
      this.snack.open('Erreur : ID client invalide', 'OK', { duration: 3000 });
      return;
    }

    console.log('Deleting client with id:', c.id);

    if (!confirm(`Supprimer ${c.nom} ?`)) return;

    this.service.delete(c.id).subscribe({
      next: () => {
        this.snack.open('Client supprimé', 'OK', { duration: 2000 });
        this.loadClients();
      },
      error: () => {
        this.snack.open('Erreur suppression', 'OK', { duration: 3000 });
      }
    });
  }


  // ================= FILTERS =================
  applyFilters(): void {
    this.currentPage.set(0);
    this.loadClients();
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  // ================= HELPERS =================
  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'PHYSIQUE': 'Particulier',
      'MORALE': 'Entreprise'
    };
    return labels[type] || type;
  }

  // ================= MASKING =================
  // Tracks which client ids have their sensitive field revealed.
  // Key format: "<clientId>-cin" or "<clientId>-rne"
  revealedFields = new Set<string>();

  /** Returns masked value showing only the last `visible` chars, rest replaced with *. */
  maskValue(value: string | undefined, visible: number): string {
    if (!value) return '-';
    if (value.length <= visible) return value;
    return '*'.repeat(value.length - visible) + value.slice(-visible);
  }

  toggleReveal(clientId: number | undefined, field: string): void {
    if (clientId == null) return;
    const key = clientId + '-' + field;
    if (this.revealedFields.has(key)) {
      this.revealedFields.delete(key);
    } else {
      this.revealedFields.add(key);
    }
  }

  isRevealed(clientId: number | undefined, field: string): boolean {
    if (clientId == null) return false;
    return this.revealedFields.has(clientId + '-' + field);
  }


  // ================= TOGGLE STATUS =================
  toggleStatus(c: Client): void {
    if (!this.canEdit()) {
      this.snack.open('❌ Permission refusée', 'OK', { duration: 3000 });
      return;
    }

    if (c.id == null || c.id === undefined) {
      console.error('toggleStatus: client id is undefined', c);
      this.snack.open('Erreur : ID client invalide', 'OK', { duration: 3000 });
      return;
    }

    const newStatus = !c.active;
    const statusText = newStatus ? 'activer' : 'désactiver';

    const ref = this.dialog.open(MatConfirmDialogComponent, {
      data: {
        title: 'Confirmer le changement',
        message: `Voulez-vous vraiment ${statusText} le client "${c.nom}" ?`,
        confirmLabel: 'Confirmer',
        cancelLabel: 'Annuler'
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      console.log('toggleStatus: PUT id=', c.id, ' active=', newStatus);

      this.service.toggleStatus(c.id!, newStatus).subscribe({
        next: (updated) => {
          this.clients.update(list =>
            list.map(item => item.id === updated.id ? { ...item, active: updated.active } : item)
          );
          const msg = newStatus ? 'Client activé' : 'Client désactivé';
          this.snack.open(msg, 'OK', { duration: 2000 });
        },
        error: (err) => {
          console.error('toggleStatus error:', err);
          this.snack.open('Erreur changement statut', 'OK', { duration: 3000 });
        }
      });
    });
  }
}
