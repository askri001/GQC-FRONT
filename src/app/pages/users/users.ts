import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
import { UserService } from '../../core/services/user.service';
import { RoleService, RoleDTO } from '../../core/services/role.service';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

@Component({
  selector: 'app-users',
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
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DrawerPanelComponent
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
                <button mat-icon-button color="primary" (click)="openEdit(u)" title="Modifier"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button [color]="u.enabled !== false ? 'warn' : 'primary'"
                  (click)="toggleStatus(u)" [title]="u.enabled !== false ? 'Désactiver' : 'Activer'">
                  <mat-icon>{{ u.enabled !== false ? 'person_off' : 'person' }}</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteUser(u)" title="Supprimer"><mat-icon>delete</mat-icon></button>
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

    <!-- Drawer -->
    <app-drawer-panel
      [open]="drawerOpen()"
      [title]="editId() === 0 ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'"
      icon="person"
      [saveLabel]="editId() === 0 ? 'Créer' : 'Sauvegarder'"
      [saveDisabled]="editId() === 0 ? !form().username || !form().email || !form().password : !form().email"
      [saving]="loading()"
      (closed)="closeDrawer()"
      (saved)="saveUser()">

      @if (editId() === 0) {
        <mat-form-field appearance="outline">
          <mat-label>Nom d'utilisateur *</mat-label>
          <input matInput [(ngModel)]="form().username">
        </mat-form-field>
      }

      <mat-form-field appearance="outline">
        <mat-label>Prénom</mat-label>
        <input matInput [(ngModel)]="form().prenom">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Nom</mat-label>
        <input matInput [(ngModel)]="form().nom">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Email *</mat-label>
        <input matInput type="email" [(ngModel)]="form().email">
      </mat-form-field>

      @if (editId() === 0) {
        <mat-form-field appearance="outline">
          <mat-label>Mot de passe *</mat-label>
          <input matInput type="password" [(ngModel)]="form().password">
        </mat-form-field>
      }

      <mat-form-field appearance="outline">
        <mat-label>Rôles</mat-label>
        <mat-select [(ngModel)]="form().roleIds" multiple>
          @for (role of availableRoles(); track role.idRole) {
            <mat-option [value]="role.idRole">{{ role.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </app-drawer-panel>
  `,
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);

  users = signal<any[]>([]);
  filteredUsersSignal = signal<any[]>([]);
  availableRoles = signal<RoleDTO[]>([]);
  loading = signal(false);

  searchTerm = '';
  pageSize = 10;
  currentPage = 0;

  drawerOpen = signal(false);
  editId = signal<number>(0);
  form = signal<any>({ username: '', prenom: '', nom: '', email: '', password: '', roleIds: [] });

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

  openCreate() {
    this.editId.set(0);
    this.form.set({ username: '', prenom: '', nom: '', email: '', password: '', roleIds: [] });
    this.drawerOpen.set(true);
  }

  openEdit(user: any) {
    this.editId.set(user.id);
    this.form.set({
      username: user.username || '',
      prenom: user.prenom || '',
      nom: user.nom || '',
      email: user.email || '',
      password: '',
      roleIds: this.extractRoleIds(user)
    });
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  saveUser() {
    const f = this.form();
    if (this.editId() === 0) {
      // Create: send roleIds in the request body — backend handles assignment
      this.loading.set(true);
      this.userService.createUser({
        username: f.username,
        email: f.email,
        prenom: f.prenom,
        nom: f.nom,
        password: f.password,
        roleIds: f.roleIds || []
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.closeDrawer();
          this.loadUsers();
          this.showNotification('Utilisateur créé', 'success');
        },
        error: (err: any) => {
          this.loading.set(false);
          console.error(err);
          this.showNotification('Erreur création', 'error');
        }
      });
    } else {
      // Update: update fields then assign roles separately
      this.loading.set(true);
      this.userService.updateUser(this.editId(), {
        prenom: f.prenom,
        nom: f.nom,
        email: f.email
      }).subscribe({
        next: () => {
          const roleAssignments = (f.roleIds || []).map((roleId: number) =>
            this.userService.assignRole(this.editId(), roleId)
          );
          if (roleAssignments.length > 0) {
            forkJoin(roleAssignments).subscribe({
              error: () => this.showNotification('Erreur assignation rôles', 'error')
            });
          }
          this.loading.set(false);
          this.closeDrawer();
          this.loadUsers();
          this.showNotification('Utilisateur mis à jour', 'success');
        },
        error: (err: any) => {
          this.loading.set(false);
          console.error(err);
          this.showNotification('Erreur mise à jour', 'error');
        }
      });
    }
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
          this.showNotification('Erreur suppression', 'error');
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
