import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {
  private userService  = inject(UserService);
  private roleService  = inject(RoleService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  readonly authService = inject(AuthService);

  users               = signal<any[]>([]);
  filteredUsersSignal = signal<any[]>([]);
  availableRoles      = signal<RoleDTO[]>([]);
  loading             = signal(false);

  searchTerm    = '';
  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  displayedColumns = ['username', 'fullName', 'email', 'roles', 'status', 'actions'];

  filteredUsers = () => this.filteredUsersSignal();

  pagedUsers(): any[] {
    const start = this.currentPage() * this.pageSize();
    return this.filteredUsersSignal().slice(start, start + this.pageSize());
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredUsersSignal().length / this.pageSize())); }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void { this.pageSize.set(Number(size)); this.currentPage.set(0); }

  getPageNumbers(): number[] {
    const total = this.totalPages(), current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const start = Math.max(0, current - 2), end = Math.min(total - 1, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => { this.users.set(data ?? []); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showNotification('Erreur chargement utilisateurs', 'error'); }
    });
  }

  loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (data) => this.availableRoles.set(data ?? []),
      error: () => {}
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) { this.filteredUsersSignal.set(this.users()); return; }
    this.filteredUsersSignal.set(this.users().filter(u =>
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.nom?.toLowerCase().includes(term) ||
      u.prenom?.toLowerCase().includes(term)
    ));
    this.currentPage.set(0);
  }

  isSelf(user: any): boolean { return user.username === this.authService.currentUser()?.username; }

  openCreate(): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '540px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { isEdit: false, availableRoles: this.availableRoles(), currentRoleIds: [], isSelf: false }
    });
    ref.afterClosed().subscribe(form => { if (form) this.doCreate(form); });
  }

  openEdit(user: any): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '540px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { isEdit: true, user, availableRoles: this.availableRoles(), currentRoleIds: this.extractRoleIds(user), isSelf: this.isSelf(user) }
    });
    ref.afterClosed().subscribe(form => { if (form) this.doUpdate(user.id, form); });
  }

  doCreate(f: any): void {
    this.loading.set(true);
    this.userService.createUser({ username: f.username, email: f.email, prenom: f.prenom, nom: f.nom, password: f.password, roleIds: f.roleId ? [f.roleId] : [] }).subscribe({
      next: () => { this.loading.set(false); this.loadUsers(); this.showNotification('Utilisateur créé', 'success'); },
      error: (err: any) => { this.loading.set(false); this.showNotification(err?.error?.message || 'Erreur création', 'error'); }
    });
  }

  doUpdate(id: number, f: any): void {
    this.loading.set(true);
    this.userService.updateUser(id, { prenom: f.prenom, nom: f.nom, email: f.email }).subscribe({
      next: () => {
        if (f.roleId && !f.isSelf) {
          this.userService.assignRole(id, f.roleId).subscribe({
            next: () => { this.loading.set(false); this.loadUsers(); this.showNotification('Utilisateur mis à jour', 'success'); },
            error: () => { this.loading.set(false); this.loadUsers(); this.showNotification('Erreur assignation rôle', 'error'); }
          });
        } else {
          this.loading.set(false); this.loadUsers(); this.showNotification('Utilisateur mis à jour', 'success');
        }
      },
      error: () => { this.loading.set(false); this.showNotification('Erreur mise à jour', 'error'); }
    });
  }

  deleteUser(user: any): void {
    if (!confirm(`Supprimer ${user.username} ?`)) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => { this.loadUsers(); this.showNotification('Utilisateur supprimé', 'success'); },
      error: (err: any) => this.showNotification(err?.error?.message || 'Erreur suppression', 'error')
    });
  }

  toggleStatus(user: any): void {
    this.userService.toggleStatus(user.id, user.enabled !== false).subscribe({
      next: () => { this.loadUsers(); this.showNotification(user.enabled !== false ? 'Utilisateur désactivé' : 'Utilisateur activé', 'success'); },
      error: () => this.showNotification('Erreur changement de statut', 'error')
    });
  }

  parseRoles(roles: any): string[] {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles.map((r: any) => typeof r === 'string' ? r : r.name).filter(Boolean);
    return [];
  }

  private extractRoleIds(user: any): number[] {
    if (!user.roles) return [];
    const roleNames: string[] = Array.isArray(user.roles) ? user.roles.map((r: any) => typeof r === 'string' ? r : r.name) : [];
    return this.availableRoles().filter(r => roleNames.includes(r.name)).map(r => r.idRole!);
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar' });
  }
}
