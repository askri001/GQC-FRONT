import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client.model';
import { ClientFormDialogComponent } from './client-form-dialog';
import { ConfirmStatusDialogComponent } from './confirm-status-dialog';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './client.html',
  styleUrls: ['./client.css'],
})
export class ClientsComponent implements OnInit {

  private clientService = inject(ClientService);
  private snackBar      = inject(MatSnackBar);
  private dialog        = inject(MatDialog);
  readonly authService  = inject(AuthService);

  // ── State ──────────────────────────────────────────────────────
  clients      = signal<Client[]>([]);
  allClients   = signal<Client[]>([]);
  totalClients = signal(0);
  loading      = signal(false);
  error        = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────
  search       = '';
  typeFilter   = '';
  statusFilter = '';

  // ── Pagination ─────────────────────────────────────────────────
  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  // ── Reveal set (CIN / RNE) ─────────────────────────────────────
  private revealedIds = new Set<number>();

  /** ID du client dont le statut est en cours de modification (loader) */
  togglingId = signal<number | null>(null);

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void { this.loadClients(); }

  // ── Load ───────────────────────────────────────────────────────
  loadClients(): void {
    this.loading.set(true);
    this.error.set(null);

    const type   = this.typeFilter   || undefined;
    const status = this.statusFilter === '' ? undefined : this.statusFilter === 'true';
    const search = this.search?.trim() || undefined;

    this.clientService
      .getPaginated(this.currentPage(), this.pageSize(), search, type, status)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.clients.set(res.content ?? []);
          this.totalClients.set(res.totalElements ?? 0);
        },
        error: (err) => {
          let msg = 'Erreur lors du chargement des clients';
          if (err?.status === 0)              msg = 'Serveur indisponible';
          else if (err?.status === 403)       msg = 'Accès refusé (403)';
          else if (err?.error?.message)       msg = err.error.message;
          this.error.set(msg);
          this.clients.set([]);
          this.totalClients.set(0);
        },
      });

    // Keep full list for duplicate checks in dialog
    this.clientService.getAll().subscribe({
      next: (all) => this.allClients.set(all),
      error: () => {},
    });
  }

  // ── Filters ────────────────────────────────────────────────────
  applyFilters(): void {
    this.currentPage.set(0);
    this.loadClients();
  }

  // ── Pagination ─────────────────────────────────────────────────
  totalPages(): number {
    return Math.max(1, Math.ceil(this.totalClients() / this.pageSize()));
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadClients();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(0);
    this.loadClients();
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

  // ── Dialog: Create ─────────────────────────────────────────────
  openCreateDialog(): void {
    const ref = this.dialog.open(ClientFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'client-dialog',
      data: { isEdit: false, existingClients: this.allClients() },
    });

    ref.afterClosed().subscribe((result?: Partial<Client>) => {
      if (!result) return;
      this.clientService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Client créé avec succès', 'OK', { duration: 3000 });
          this.loadClients();
        },
        error: () => this.snackBar.open('Erreur lors de la création', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Dialog: Edit ───────────────────────────────────────────────
  openEditDialog(client: Client): void {
    const ref = this.dialog.open(ClientFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'client-dialog',
      data: { isEdit: true, client, existingClients: this.allClients() },
    });

    ref.afterClosed().subscribe((result?: Partial<Client>) => {
      if (!result) return;
      this.clientService.update(client.id!, result).subscribe({
        next: () => {
          this.snackBar.open('Client modifié avec succès', 'OK', { duration: 3000 });
          this.loadClients();
        },
        error: () => this.snackBar.open('Erreur lors de la modification', 'OK', { duration: 3000 }),
      });
    });
  }

  // ── Delete ─────────────────────────────────────────────────────
  confirmDelete(c: Client): void {
    if (!confirm(`Supprimer le client "${c.nom}" ? Cette action est irréversible.`)) return;
    this.clientService.delete(c.id!).subscribe({
      next: () => {
        this.snackBar.open('Client supprimé', 'OK', { duration: 2500 });
        this.loadClients();
      },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 }),
    });
  }

  // ── Toggle status ──────────────────────────────────────────────
  toggleStatus(c: Client): void {
    const nextActive = !c.active;
    const clientName = c.prenom ? `${c.nom} ${c.prenom}` : c.nom;

    const ref = this.dialog.open(ConfirmStatusDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      panelClass: 'confirm-status-dialog',
      data: { activate: nextActive, clientName },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.togglingId.set(c.id!);

      this.clientService
        .updateStatus(c.id!, nextActive)
        .pipe(finalize(() => this.togglingId.set(null)))
        .subscribe({
          next: (updated) => {
            // Mise à jour optimiste dans la liste sans rechargement
            this.clients.update(list =>
              list.map(item => item.id === c.id ? { ...item, active: updated.active } : item)
            );
            const label = nextActive ? 'activé' : 'désactivé';
            this.snackBar.open(`Client ${label} avec succès`, 'OK', { duration: 2500 });
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

  isRevealed(id: number): boolean { return this.revealedIds.has(id); }

  toggleReveal(id: number): void {
    this.revealedIds.has(id) ? this.revealedIds.delete(id) : this.revealedIds.add(id);
    this.clients.set([...this.clients()]); // trigger change detection
  }

  maskValue(value: string): string {
    if (!value) return '—';
    return '•'.repeat(Math.max(0, value.length - 3)) + value.slice(-3);
  }

  getTypeLabel(type: string): string {
    return type === 'PHYSIQUE' ? 'Particulier' : 'Entreprise';
  }
}
