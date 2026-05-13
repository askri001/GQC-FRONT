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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../core/services/user.service';
import { RoleService, RoleDTO } from '../../core/services/role.service';
import { UserFormDialogComponent } from './user-form-dialog';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <div class="header-title">
            <mat-icon class="title-icon">people</mat-icon>
            <h2>Gestion des Utilisateurs</h2>
          </div>
          <button mat-raised-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> Nouvel Utilisateur
          </button>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="searchTerm" (input)="applyFilter()" placeholder="Rechercher...">
          </mat-form-field>
        </div>

        @if (loading()) {
          <div class="loading"><mat-spinner diameter="50"></mat-spinner><p>Chargement...</p></div>
        } @else if (filteredUsers().length === 0) {
          <div class="no-data"><mat-icon>people</mat-icon><p>Aucun utilisateur trouvé</p></div>
        } @else {
          <table mat-table [dataSource]="pagedUsers()" class="mat-elevation-z2 full-width">

            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Nom d'utilisateur</th>
              <td mat-cell *matCellDef="let u">{{ u.username }}</td>
            </ng-container>

            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Nom Complet</th>
              <td mat-cell *matCellDef="let u">{{ u.prenom || '' }} {{ u.nom || '' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>

            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Rôles</th>
              <td mat-cell *matCellDef="let u">
                @for (role of parseRoles(u.roles); track role) {
                  <mat-chip>{{ role }}</mat-chip>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip [class]="u.enabled !== false ? 'active-chip' : 'inactive-chip'">
                  {{ u.enabled !== false ? 'Actif' : 'Inactif' }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button color="primary" (click)="openEdit(u)" title="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>
                @if (!isSelf(u)) {
                  <button mat-icon-button [color]="u.enabled !== false ? 'warn' : 'primary'"
                    (click)="toggleStatus(u)" [title]="u.enabled !== false ? 'Désactiver' : 'Activer'">
                    <mat-icon>{{ u.enabled !== false ? 'person_off' : 'person' }}</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteUser(u)" title="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                } @else {
                  <mat-icon style="font-size:16px;color:#7aada0;vertical-align:middle;margin:0 4px"
                    title="Votre propre compte — désactivation et suppression non autorisées">
                    lock
                  </mat-icon>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="filteredUsers().length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </mat-card>
    </div>
  `,
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private snackBar    = inject(MatSnackBar);
  private dialog      = inject(MatDialog);
  readonly authService = inject(AuthService);

  users               = signal<any[]>([]);
  filteredUsersSignal = signal<any[]>([]);
  availableRoles      = signal<RoleDTO[]>([]);
  loading             = signal(false);

  searchTerm  = '';
  pageSize    = 10;
  currentPage = 0;

  displayedColumns = ['username', 'fullName', 'email', 'roles', 'status', 'actions'];

  filteredUsers = () => this.filteredUsersSignal();

  pagedUsers = () => {
    const start = this.currentPage * this.pageSize;
    return this.filteredUsersSignal().slice(start, start + this.pageSize);
  };

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showNotification('Erreur chargement utilisateurs', 'error');
      }
    });
  }

  loadRoles() {
    this.roleService.getAll().subscribe({
      next: (data) => this.availableRoles.set(data),
      error: (err) => console.error('Error loading roles', err)
    });
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredUsersSignal.set(this.users());
      return;
    }
    this.filteredUsersSignal.set(this.users().filter(u =>
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.nom?.toLowerCase().includes(term) ||
      u.prenom?.toLowerCase().includes(term)
    ));
    this.currentPage = 0;
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  isSelf(user: any): boolean {
    return user.username === this.authService.currentUser()?.username;
  }

  openCreate() {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '560px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { isEdit: false, availableRoles: this.availableRoles(), currentRoleIds: [], isSelf: false }
    });
    ref.afterClosed().subscribe(form => { if (form) this.doCreate(form); });
  }

  openEdit(user: any) {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '560px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: {
        isEdit: true,
        user,
        availableRoles: this.availableRoles(),
        currentRoleIds: this.extractRoleIds(user),
        isSelf: this.isSelf(user)
      }
    });
    ref.afterClosed().subscribe(form => { if (form) this.doUpdate(user.id, form); });
  }

  doCreate(f: any) {
    this.loading.set(true);
    this.userService.createUser({
      username: f.username, email: f.email, prenom: f.prenom,
      nom: f.nom, password: f.password,
      roleIds: f.roleId ? [f.roleId] : []
    }).subscribe({
      next: () => { this.loading.set(false); this.loadUsers(); this.showNotification('Utilisateur créé', 'success'); },
      error: (err: any) => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Erreur création';
        this.showNotification(msg, 'error');
      }
    });
  }

  doUpdate(id: number, f: any) {
    this.loading.set(true);
    this.userService.updateUser(id, { prenom: f.prenom, nom: f.nom, email: f.email }).subscribe({
      next: () => {
        // Only update role if not editing self and a role was selected
        if (f.roleId && !f.isSelf) {
          this.userService.assignRole(id, f.roleId).subscribe({
            error: () => this.showNotification('Erreur assignation rôle', 'error')
          });
        }
        this.loading.set(false);
        this.loadUsers();
        this.showNotification('Utilisateur mis à jour', 'success');
      },
      error: () => { this.loading.set(false); this.showNotification('Erreur mise à jour', 'error'); }
    });
  }

  deleteUser(user: any) {
    if (confirm(`Supprimer ${user.username} ?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.showNotification('Utilisateur supprimé', 'success');
        },
        error: (err: any) => {
          console.error(err);
          const msg = err?.error?.message || 'Erreur suppression';
          this.showNotification(msg, 'error');
        }
      });
    }
  }

  toggleStatus(user: any) {
    this.userService.toggleStatus(user.id, user.enabled !== false).subscribe({
      next: () => {
        this.loadUsers();
        this.showNotification(
          user.enabled !== false ? 'Utilisateur désactivé' : 'Utilisateur activé',
          'success'
        );
      },
      error: (err: any) => {
        console.error(err);
        this.showNotification('Erreur changement de statut', 'error');
      }
    });
  }

  parseRoles(roles: any): string[] {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles.map((r: any) => typeof r === 'string' ? r : r.name).filter(Boolean);
    return [];
  }

  private extractRoleIds(user: any): number[] {
    if (!user.roles) return [];
    // roles from backend are strings (role names) — match against loaded roles by name
    const roleNames: string[] = Array.isArray(user.roles)
      ? user.roles.map((r: any) => typeof r === 'string' ? r : r.name)
      : [];
    return this.availableRoles()
      .filter(r => roleNames.includes(r.name))
      .map(r => r.idRole!);
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass });
  }
}
