import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client.model';

interface ExtendedClient extends Client {
  dateCreation?: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  templateUrl: './client.html',
  styleUrls: ['./client-modern.css']
})
export class ClientsComponent {
  private clientService = inject(ClientService);
  private snackBar = inject(MatSnackBar);

  clients = signal<ExtendedClient[]>([]);
  loading = signal(false);
  editMode = signal(false);
  editId = signal<number | null>(null);
  tempClient = signal<Partial<Client>>({});

  search = signal('');
  actifFilter = signal<string>('');

  pageSize = 10;
  currentPage = 0;

  displayedColumns = [
    'nom',
    'cin',
    'tel',
    'email',
    'adresse',
    'dateCreation',
    'active',
    'actions'
  ];

  constructor() {
    this.loadClients();
  }

  loadClients(): void {
    this.loading.set(true);
  this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients.set(
          data.map(c => ({
            ...c,
            active: c.active ?? true
          }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur chargement', 'OK');
      }
    });
  }

  applyFilter(): void {
    // Signals are reactive, no need for manual filter trigger
  }

  filteredClients = computed(() => {
    return this.clients().filter(c => {
      const matchSearch =
        !this.search() ||
        (c.nom ?? '').toLowerCase().includes(this.search()!.toLowerCase()) ||
        (c.cin ?? '').toLowerCase().includes(this.search()!.toLowerCase()) ||
        (c.tel ?? '').includes(this.search()!) ||
        (c.email ?? '').toLowerCase().includes(this.search()!.toLowerCase());

      const matchStatus =
        this.actifFilter() === '' ||
        c.active === (this.actifFilter() === 'true');

      return matchSearch && matchStatus;
    });
  });

  pagedClients = computed(() => {
    const start = this.currentPage * this.pageSize;
    return this.filteredClients().slice(start, start + this.pageSize);
  });

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  startInlineEdit(id?: number): void {
    if (id) {
      const client = this.clients().find(c => c.id === id);
      this.tempClient.set({ ...client });
    } else {
      this.tempClient.set({
        active: true
      });
    }
    this.editId.set(id ?? null);
    this.editMode.set(true);
  }

  cancelInlineEdit(): void {
    this.editMode.set(false);
    this.editId.set(null);
    this.tempClient.set({});
  }

  saveInlineEdit(): void {
    const temp = this.tempClient();
    if (!temp.nom || !temp.cin) {
      this.snackBar.open('Nom et CIN requis', 'OK');
      return;
    }

    const payload: Partial<Client> = {
      id: this.editId() ?? undefined,
      nom: temp.nom!,
      prenom: temp.prenom || '',
      cin: temp.cin!,
      tel: temp.tel || '',
      email: temp.email,
      adresse: temp.adresse,
      active: temp.active ?? true
    };

    const request = this.editId()
      ? this.clientService.update(this.editId()!, payload as Client)
      : this.clientService.create(payload as Client);

    request.subscribe({
      next: () => {
        this.snackBar.open('Sauvegardé avec succès', 'OK');
        this.loadClients();
        this.cancelInlineEdit();
      },
      error: () => {
        this.snackBar.open('Erreur sauvegarde', 'OK');
      }
    });
  }

  confirmDelete(c: ExtendedClient): void {
    if (confirm(`Supprimer ${c.nom} ?`)) {
      this.clientService.delete(c.id!).subscribe({
        next: () => {
          this.snackBar.open('Supprimé', 'OK');
          this.loadClients();
        },
        error: () => this.snackBar.open('Erreur suppression', 'OK')
      });
    }
  }

  toggleStatus(c: ExtendedClient): void {
    const updated = { ...c, active: !c.active };
    this.clientService.update(c.id!, updated).subscribe({
      next: () => this.loadClients(),
      error: () => this.snackBar.open('Erreur statut', 'OK')
    });
  }

  showDetail(c: ExtendedClient): void {
    this.snackBar.open(
      `${c.nom} ${c.prenom ?? ''} | ${c.tel} | ${c.email ?? '-'}`,
      'OK',
      { duration: 3000 }
    );
  }
}

