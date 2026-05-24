import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { DossierService } from '../../core/services/dossier.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import { DossierFormDialogComponent } from './dossier-form-dialog';
import type { Dossier } from '../../core/models/dossier.model';
import { DOSSIER_STATUT_LABELS, NIVEAU_RISQUE_LABELS } from '../../core/models/dossier.model';
import { Client } from '../../core/models/client.model';

@Component({
  selector: 'app-dossiers',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatTooltipModule, MatDialogModule
  ],
  templateUrl: './dossiers.html',
  styleUrls: ['./dossiers.css']
})
export class DossiersComponent implements OnInit {
  private dossierService = inject(DossierService);
  private api            = inject(ApiService);
  private snackBar       = inject(MatSnackBar);
  readonly authService   = inject(AuthService);
  private dialog         = inject(MatDialog);
  private messageService = inject(MessageService);

  dossiers = signal<Dossier[]>([]);
  clients  = signal<Client[]>([]);
  users    = signal<any[]>([]);
  loading  = signal(false);

  searchTerm   = '';
  statutFilter = '';
  clientFilter = 0;

  pageSizeValue = 10;
  pageSize      = signal(10);
  currentPage   = signal(0);

  editId           = signal<number | null>(null);
  editMode         = signal(false);
  tempDossier: Partial<Dossier> = {};
  selectedClientId = 0;

  ngOnInit(): void {
    this.loadDossiers();
    this.loadClients();
    this.api.get<any[]>('/users/for-messaging').subscribe({
      next: (data) => this.users.set(data ?? []),
      error: () => {}
    });
  }

  loadClients(): void {
    this.api.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients.set(data ?? []),
      error: () => {}
    });
  }

  loadDossiers(): void {
    this.loading.set(true);
    this.dossierService.getAll().subscribe({
      next: (data) => { this.dossiers.set(data ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showNotification('Erreur chargement dossiers', 'error'); }
    });
  }

  getFiltered(): Dossier[] {
    let r = this.dossiers();
    if (this.searchTerm)   r = r.filter(d => d.reference.toLowerCase().includes(this.searchTerm.toLowerCase()));
    if (this.statutFilter) r = r.filter(d => d.statut === this.statutFilter);
    if (this.clientFilter) r = r.filter(d => d.clientId === this.clientFilter);
    return r;
  }

  filteredCount(): number { return this.getFiltered().length; }

  pagedDossiers(): Dossier[] {
    const start = this.currentPage() * this.pageSize();
    return this.getFiltered().slice(start, start + this.pageSize());
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredCount() / this.pageSize())); }

  applyFilters(): void { this.currentPage.set(0); }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(0);
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

  showActions(): boolean {
    return this.authService.hasRole('ROLE_CHARGEDOSSIER') ||
           this.authService.hasRole('ROLE_RESPONSABLE') ||
           this.authService.isAdmin();
  }

  createDossier(): void {
    const currentUserId = Number(localStorage.getItem('auth_user_id')) || undefined;
    const ref = this.dialog.open(DossierFormDialogComponent, {
      width: '540px', maxWidth: '95vw', panelClass: 'form-dialog',
      data: { isEdit: false, dossier: { statut: 'EN_COURS', niveauRisque: 'FAIBLE', dateOuverture: new Date(), chargeDossierId: currentUserId } }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      result.chargeDossierId = currentUserId;
      this.dossierService.create(result as Omit<Dossier, 'idDossier'>).subscribe({
        next: () => { this.loadDossiers(); this.showNotification('Dossier créé', 'success'); },
        error: () => this.showNotification('Erreur création', 'error')
      });
    });
  }

  editDossier(dossier: Dossier): void {
    const ref = this.dialog.open(DossierFormDialogComponent, {
      width: '540px', maxWidth: '95vw', panelClass: 'form-dialog',
      data: { isEdit: true, dossier }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.dossierService.update(dossier.idDossier!, { ...dossier, ...result } as Dossier).subscribe({
        next: () => { this.loadDossiers(); this.showNotification('Dossier modifié', 'success'); },
        error: () => this.showNotification('Erreur modification', 'error')
      });
    });
  }

  saveDossier(): void {}
  cancelEdit(): void {}

  deleteDossier(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.dossierService.delete(id).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Dossier supprimé', 'success'); },
      error: () => this.showNotification('Erreur suppression', 'error')
    });
  }

  soumettre(dossier: Dossier): void {
    if (!confirm(`Soumettre le dossier "${dossier.reference}" pour validation ?`)) return;
    this.dossierService.update(dossier.idDossier!, { ...dossier, statut: 'EN_ATTENTE_VALIDATION' }).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Dossier soumis pour validation', 'success'); },
      error: () => this.showNotification('Erreur lors de la soumission', 'error')
    });
  }

  valider(dossier: Dossier): void {
    if (!confirm(`Valider le dossier "${dossier.reference}" ?`)) return;
    this.dossierService.validate(dossier.idDossier!).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Dossier validé', 'success'); },
      error: () => this.showNotification('Erreur lors de la validation', 'error')
    });
  }

  rejeter(dossier: Dossier): void {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: 'Rejeter le dossier', sousTitre: `Dossier : ${dossier.reference}` }
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null) return;
      this.dossierService.reject(dossier.idDossier!, commentaire).subscribe({
        next: (updated) => {
          this.loadDossiers();
          this.showNotification('Dossier rejeté', 'success');
          if (updated.chargeDossierId) {
            this.messageService.send({
              toUserId: updated.chargeDossierId,
              subject:  `Dossier rejeté : ${dossier.reference}`,
              body:     commentaire || 'Votre dossier a été rejeté.',
              entityType: 'DOSSIER', entityId: dossier.idDossier,
            }).subscribe();
          }
        },
        error: () => this.showNotification('Erreur lors du rejet', 'error')
      });
    });
  }

  demanderCloture(dossier: Dossier): void {
    if (!confirm(`Demander la clôture du dossier "${dossier.reference}" ?`)) return;
    this.dossierService.requestClosure(dossier.idDossier!).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Demande de clôture envoyée', 'success'); },
      error: () => this.showNotification('Erreur lors de la demande de clôture', 'error')
    });
  }

  cloturerDossier(dossier: Dossier): void {
    if (!confirm(`Clôturer définitivement le dossier "${dossier.reference}" ? Cette action est irréversible.`)) return;
    this.dossierService.close(dossier.idDossier!).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Dossier clôturé', 'success'); },
      error: () => this.showNotification('Erreur lors de la clôture', 'error')
    });
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      'EN_COURS': 'chip-en_cours', 'VALIDE': 'chip-active',
      'CLOTURE': 'chip-active', 'SUSPENDU': 'chip-en_attente',
      'TRANSFERE': 'chip-transfere', 'EN_ATTENTE_VALIDATION': 'chip-validation',
      'EN_ATTENTE_CLOTURE': 'chip-closure'
    };
    return map[statut] ?? '';
  }

  getRisqueClass(risque: string): string {
    const map: Record<string, string> = {
      'FAIBLE': 'chip-faible', 'MOYEN': 'chip-moyen',
      'ELEVE': 'chip-eleve', 'CRITIQUE': 'chip-critique'
    };
    return map[risque] ?? '';
  }

  getStatutLabel(statut: string): string {
    return DOSSIER_STATUT_LABELS[statut as keyof typeof DOSSIER_STATUT_LABELS] || statut;
  }

  getRisqueLabel(risque: string): string {
    return NIVEAU_RISQUE_LABELS[risque as keyof typeof NIVEAU_RISQUE_LABELS] || risque;
  }

  getClientLabel(client: Client): string {
    return `${client.nom}${client.prenom ? ' ' + client.prenom : ''}${client.cin ? ' (' + client.cin + ')' : ''}`.trim();
  }

  getClientName(clientId: number): string {
    const d = this.dossiers().find(d => d.clientId === clientId);
    if (d?.clientNom) return `${d.clientNom}${d.clientPrenom ? ' ' + d.clientPrenom : ''}`.trim();
    const c = this.clients().find(c => c.id === clientId);
    return c ? `${c.nom}${c.prenom ? ' ' + c.prenom : ''}`.trim() : `#${clientId}`;
  }

  getChargeName(chargeId: number | undefined): string {
    if (!chargeId) return '—';
    const u = this.users().find(u => u.id === chargeId);
    if (u) return `${u.prenom || ''} ${u.nom || ''}`.trim() || u.username;
    const d = this.dossiers().find(d => d.chargeDossierId === chargeId);
    if (d?.chargeDossierNom) return `${d.chargeDossierPrenom || ''} ${d.chargeDossierNom}`.trim();
    return `#${chargeId}`;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, 'Fermer', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  exportPdf(dossier: Dossier): void {
    const client  = this.getClientName(dossier.clientId);
    const charge  = this.getChargeName(dossier.chargeDossierId);
    const statut  = this.getStatutLabel(dossier.statut);
    const risque  = this.getRisqueLabel(dossier.niveauRisque);
    const dateOuv = dossier.dateOuverture ? new Date(dossier.dateOuverture).toLocaleDateString('fr-TN') : '—';
    const dateClo = dossier.dateCloture   ? new Date(dossier.dateCloture).toLocaleDateString('fr-TN')   : '—';
    const montantI = new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(dossier.montantInitial ?? 0);
    const montantR = new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(dossier.montantRecupere ?? 0);
    const taux     = dossier.montantInitial ? ((dossier.montantRecupere ?? 0) / dossier.montantInitial * 100).toFixed(1) + '%' : '0%';
    const now      = new Date().toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Dossier ${dossier.reference}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #00966E;padding-bottom:20px;margin-bottom:28px}
    .header-left h1{font-size:22px;color:#00966E;font-weight:700}.header-left p{font-size:12px;color:#666;margin-top:4px}
    .header-right{text-align:right;font-size:12px;color:#555}.ref{font-size:16px;font-weight:700;color:#1a1a1a}
    .section-title{font-size:13px;font-weight:700;color:#00966E;text-transform:uppercase;border-left:4px solid #00966E;padding-left:10px;margin:24px 0 12px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 32px}.field{display:flex;flex-direction:column}
    .field label{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:2px}.field span{font-size:13px;font-weight:600;color:#1a1a1a}
    .fin-table{width:100%;border-collapse:collapse;margin-top:8px}
    .fin-table th{background:#00966E;color:#fff;padding:9px 14px;text-align:left;font-size:12px;font-weight:600}
    .fin-table td{padding:9px 14px;border-bottom:1px solid #e8f3ee;font-size:13px}
    .fin-table tr:last-child td{border-bottom:none;font-weight:700;background:#f0faf6}
    .progress-wrap{margin-top:10px}.progress-label{display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px}
    .progress-bar{height:10px;background:#e0f5ee;border-radius:5px;overflow:hidden}
    .progress-fill{height:100%;background:#00966E;border-radius:5px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:11px;color:#999}
    @media print{body{padding:20px}@page{margin:15mm;size:A4}}</style></head><body>
    <div class="header"><div class="header-left"><h1>Dossier Contentieux</h1><p>Gestion Administrative des Contentieux — BNA</p></div>
    <div class="header-right"><div class="ref">${dossier.reference}</div><div style="margin-top:6px">Généré le ${now}</div></div></div>
    <div class="section-title">Informations Générales</div>
    <div class="grid">
      <div class="field"><label>Client</label><span>${client}</span></div>
      <div class="field"><label>Chargé de Dossier</label><span>${charge}</span></div>
      <div class="field"><label>Date d'Ouverture</label><span>${dateOuv}</span></div>
      <div class="field"><label>Date de Clôture</label><span>${dateClo}</span></div>
      <div class="field"><label>Statut</label><span>${statut}</span></div>
      <div class="field"><label>Niveau de Risque</label><span>${risque}</span></div>
    </div>
    <div class="section-title">Situation Financière</div>
    <table class="fin-table"><thead><tr><th>Indicateur</th><th>Montant</th></tr></thead>
    <tbody><tr><td>Montant Initial</td><td>${montantI}</td></tr>
    <tr><td>Montant Récupéré</td><td>${montantR}</td></tr>
    <tr><td>Taux de Recouvrement</td><td>${taux}</td></tr></tbody></table>
    <div class="progress-wrap"><div class="progress-label"><span>Progression</span><span>${taux}</span></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, parseFloat(taux))}%"></div></div></div>
    <div class="footer"><span>Document généré automatiquement — BNA</span><span>Réf: ${dossier.reference} | ID: ${dossier.idDossier}</span></div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { this.showNotification('Veuillez autoriser les popups', 'error'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }
}
