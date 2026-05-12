import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DossierService } from '../../core/services/dossier.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RejetCommentaireDialogComponent } from '../../shared/rejet-commentaire-dialog/rejet-commentaire-dialog.component';
import type { Dossier } from '../../core/models/dossier.model';
import { DOSSIER_STATUT_LABELS, NIVEAU_RISQUE_LABELS } from '../../core/models/dossier.model';
import { Client } from '../../core/models/client.model';
import { DrawerPanelComponent } from '../../shared/drawer-panel/drawer-panel.component';

@Component({
  selector: 'app-dossiers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    DrawerPanelComponent,
    RouterModule,
    MatDialogModule
  ],
  templateUrl: "./dossiers.html",
  styleUrls: ["./dossiers.css"]
})
export class DossiersComponent implements OnInit {
  private dossierService = inject(DossierService);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);
  private dialog = inject(MatDialog);

  dossiers = signal<Dossier[]>([]);
  clients = signal<Client[]>([]);
  chargeDossiers = signal<any[]>([]);
  displayedColumns: string[] = ['reference', 'client', 'chargeDossier', 'dateOuverture', 'statut', 'niveauRisque', 'montantInitial', 'montantRecupere', 'actions'];

  get cols(): string[] {
    return this.authService.isAdmin()
      ? this.displayedColumns.filter(c => c !== 'actions')
      : this.displayedColumns;
  }

  
  searchTerm = '';
  statutFilter = '';
  pageSize = 10;
  currentPage = 0;

  
  loading = signal(false);

  
  editId = signal<number | null>(null);
  editMode = signal(false);
  tempDossier: Partial<Dossier> = {};
  selectedClientId = 0;
  selectedChargeDossierId = 0;

  
  get filteredDossiers() {
    let result = this.dossiers();
    if (this.searchTerm) {
      result = result.filter(d => 
        d.reference.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    if (this.statutFilter) {
      result = result.filter(d => d.statut === this.statutFilter);
    }
    const start = this.currentPage * this.pageSize;
    return result.slice(start, start + this.pageSize);
  }

  get totalDossiers() {
    return this.dossiers().length;
  }

  ngOnInit() {
    this.loadDossiers();
    this.loadClients();
    this.loadChargeDossiers();
  }

  loadChargeDossiers() {
    this.api.get<any[]>('/users/chargedossiers').subscribe({
      next: (data) => this.chargeDossiers.set(data ?? []),
      error: (err) => console.error('Error loading chargeDossiers', err)
    });
  }

  loadClients() {
    this.api.get<Client[]>('/clients').subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error loading clients', err)
    });
  }

  loadDossiers() {
    this.loading.set(true);
    this.dossierService.getAll().subscribe({
      next: (data) => {
        this.dossiers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dossiers', err);
        this.loading.set(false);
        this.showNotification('Erreur chargement dossiers', 'error');
      }
    });
  }

  createDossier() {
    this.editId.set(0);
    this.tempDossier = {
      reference: '',
      dateOuverture: new Date(),
      statut: 'EN_COURS',
      niveauRisque: 'FAIBLE',
      montantInitial: 0,
      montantRecupere: 0,
      clientId: 0
    };
    this.selectedClientId = 0;
    this.selectedChargeDossierId = 0;
    this.editMode.set(true);
  }

  editDossier(dossier: Dossier) {
    this.editId.set(dossier.idDossier!);
    this.tempDossier = { ...dossier };
    this.selectedClientId = dossier.clientId;
    this.selectedChargeDossierId = dossier.chargeDossierId || 0;
    this.editMode.set(true);
  }

  saveDossier() {
    const temp = this.tempDossier;

    temp.clientId = this.selectedClientId;
    temp.chargeDossierId = this.selectedChargeDossierId || undefined;

    if (!temp.reference?.trim()) {
      this.showNotification('La référence est requise', 'error');
      return;
    }
    if (!temp.clientId || temp.clientId === 0) {
      this.showNotification('Veuillez sélectionner un client', 'error');
      return;
    }
    if (temp.montantInitial === undefined || temp.montantInitial === null) {
      this.showNotification('Le montant initial est requis', 'error');
      return;
    }

    const request = this.editId() === 0
      ? this.dossierService.create(temp as Omit<Dossier, 'idDossier'>)
      : this.dossierService.update(this.editId()!, temp as Dossier);

    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.loadDossiers();
        this.cancelEdit();
        this.showNotification('Dossier sauvegardé', 'success');
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Save error', err);
        this.showNotification('Erreur sauvegarde: ' + err.message, 'error');
      }
    });
  }

  deleteDossier(id: number) {
    if (confirm('Confirmer la suppression ?')) {
      this.dossierService.delete(id).subscribe({
        next: () => {
          this.loadDossiers();
          this.showNotification('Dossier supprimé', 'success');
        },
        error: (err) => {
          console.error('Delete error', err);
          this.showNotification('Erreur suppression', 'error');
        }
      });
    }
  }

  soumettre(dossier: Dossier) {
    if (!confirm(`Soumettre le dossier "${dossier.reference}" pour validation ?`)) return;
    this.dossierService.update(dossier.idDossier!, { ...dossier, statut: 'EN_ATTENTE_VALIDATION' }).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Dossier soumis pour validation', 'success'); },
      error: () => this.showNotification('Erreur lors de la soumission', 'error')
    });
  }

  valider(dossier: Dossier) {
    if (!confirm(`Valider le dossier "${dossier.reference}" ?`)) return;
    this.dossierService.validate(dossier.idDossier!).subscribe({
      next: () => { this.loadDossiers(); this.showNotification('Dossier validé', 'success'); },
      error: () => this.showNotification('Erreur lors de la validation', 'error')
    });
  }

  rejeter(dossier: Dossier) {
    const ref = this.dialog.open(RejetCommentaireDialogComponent, {
      width: '480px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { titre: 'Rejeter le dossier', sousTitre: `Dossier : ${dossier.reference}` }
    });
    ref.afterClosed().subscribe(commentaire => {
      if (commentaire === null) return;
      this.dossierService.reject(dossier.idDossier!, commentaire).subscribe({
        next: () => { this.loadDossiers(); this.showNotification('Dossier rejeté — renvoyé en cours', 'success'); },
        error: () => this.showNotification('Erreur lors du rejet', 'error')
      });
    });
  }

  cancelEdit() {
    this.editId.set(null);
    this.tempDossier = {};
    this.editMode.set(false);
    this.selectedClientId = 0;
    this.selectedChargeDossierId = 0;
  }

  applyFilters() {
    this.currentPage = 0; 
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
  }

  getStatutClass(statut: string): string {
    return `status-chip status-${statut.toLowerCase().replace('_', '-')}`;
  }

  getRisqueClass(risque: string): string {
    return `risk-chip risk-${risque.toLowerCase()}`;
  }

  getStatutLabel(statut: string): string {
    return DOSSIER_STATUT_LABELS[statut as keyof typeof DOSSIER_STATUT_LABELS] || statut;
  }

  getRisqueLabel(risque: string): string {
    return NIVEAU_RISQUE_LABELS[risque as keyof typeof NIVEAU_RISQUE_LABELS] || risque;
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    const panelClass = type === 'success' ? 'success-snackbar' : 'error-snackbar';
    this.snackBar.open(msg, 'Close', { duration: 3000, panelClass });
  }

  getClientLabel(client: Client): string {
    return `${client.nom}${client.prenom ? ' ' + client.prenom : ''} ${client.cin ? '(' + client.cin + ')' : ''}`.trim();
  }

  getClientName(clientId: number): string {
    const d = this.dossiers().find(d => d.clientId === clientId);
    if (d?.clientNom) return `${d.clientNom}${d.clientPrenom ? ' ' + d.clientPrenom : ''}`.trim();
    const client = this.clients().find(c => c.id === clientId);
    return client ? `${client.nom}${client.prenom ? ' ' + client.prenom : ''}`.trim() : `#${clientId}`;
  }

  getChargeName(chargeId: number | undefined): string {
    if (!chargeId) return '—';
    const d = this.dossiers().find(d => d.chargeDossierId === chargeId);
    if (d?.chargeDossierNom) return `${d.chargeDossierPrenom || ''} ${d.chargeDossierNom}`.trim();
    const cd = this.chargeDossiers().find(c => c.id === chargeId);
    return cd ? `${cd.prenom || ''} ${cd.nom || ''}`.trim() || cd.username : `#${chargeId}`;
  }

  exportPdf(dossier: Dossier): void {
    const client    = this.getClientName(dossier.clientId);
    const charge    = this.getChargeName(dossier.chargeDossierId);
    const statut    = this.getStatutLabel(dossier.statut);
    const risque    = this.getRisqueLabel(dossier.niveauRisque);
    const dateOuv   = dossier.dateOuverture
      ? new Date(dossier.dateOuverture).toLocaleDateString('fr-TN')
      : '—';
    const dateClo   = dossier.dateCloture
      ? new Date(dossier.dateCloture).toLocaleDateString('fr-TN')
      : '—';
    const montantI  = new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(dossier.montantInitial ?? 0);
    const montantR  = new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(dossier.montantRecupere ?? 0);
    const taux      = dossier.montantInitial
      ? ((dossier.montantRecupere ?? 0) / dossier.montantInitial * 100).toFixed(1) + '%'
      : '0%';
    const now       = new Date().toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <title>Dossier ${dossier.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; }

          /* Header */
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #00966E; padding-bottom: 20px; margin-bottom: 28px; }
          .header-left h1 { font-size: 22px; color: #00966E; font-weight: 700; }
          .header-left p  { font-size: 12px; color: #666; margin-top: 4px; }
          .header-right   { text-align: right; font-size: 12px; color: #555; }
          .header-right .ref { font-size: 16px; font-weight: 700; color: #1a1a1a; }

          /* Section title */
          .section-title { font-size: 13px; font-weight: 700; color: #00966E; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #00966E; padding-left: 10px; margin: 24px 0 12px; }

          /* Grid */
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 32px; }
          .field { display: flex; flex-direction: column; }
          .field label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
          .field span  { font-size: 13px; font-weight: 600; color: #1a1a1a; }

          /* Badges */
          .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .badge-en_cours   { background: #e0f5ee; color: #00966E; }
          .badge-cloture    { background: #d1fae5; color: #059669; }
          .badge-suspendu   { background: #fef3c7; color: #d97706; }
          .badge-transfere  { background: #f3e5f5; color: #7b1fa2; }
          .badge-en_attente { background: #f5f5f5; color: #616161; }
          .badge-faible     { background: #d1fae5; color: #059669; }
          .badge-moyen      { background: #fef3c7; color: #d97706; }
          .badge-eleve      { background: #fee2e2; color: #dc2626; }
          .badge-critique   { background: #fee2e2; color: #dc2626; font-weight: 800; }

          /* Financial table */
          .fin-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .fin-table th { background: #00966E; color: #fff; padding: 9px 14px; text-align: left; font-size: 12px; font-weight: 600; }
          .fin-table td { padding: 9px 14px; border-bottom: 1px solid #e8f3ee; font-size: 13px; }
          .fin-table tr:last-child td { border-bottom: none; font-weight: 700; background: #f0faf6; }

          /* Progress bar */
          .progress-wrap { margin-top: 10px; }
          .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 4px; }
          .progress-bar { height: 10px; background: #e0f5ee; border-radius: 5px; overflow: hidden; }
          .progress-fill { height: 100%; background: #00966E; border-radius: 5px; }

          /* Footer */
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; color: #999; }

          @media print {
            body { padding: 20px; }
            @page { margin: 15mm; size: A4; }
          }
        </style>
      </head>
      <body>

        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <h1>Dossier Contentieux</h1>
            <p>Gestion Administrative des Contentieux — BNA</p>
          </div>
          <div class="header-right">
            <div class="ref">${dossier.reference}</div>
            <div style="margin-top:6px">Généré le ${now}</div>
          </div>
        </div>

        <!-- INFORMATIONS GÉNÉRALES -->
        <div class="section-title">Informations Générales</div>
        <div class="grid">
          <div class="field"><label>Client</label><span>${client}</span></div>
          <div class="field"><label>Chargé de Dossier</label><span>${charge}</span></div>
          <div class="field"><label>Date d'Ouverture</label><span>${dateOuv}</span></div>
          <div class="field"><label>Date de Clôture</label><span>${dateClo}</span></div>
          <div class="field">
            <label>Statut</label>
            <span><span class="badge badge-${dossier.statut?.toLowerCase().replace('_','-')}">${statut}</span></span>
          </div>
          <div class="field">
            <label>Niveau de Risque</label>
            <span><span class="badge badge-${dossier.niveauRisque?.toLowerCase()}">${risque}</span></span>
          </div>
        </div>

        <!-- SITUATION FINANCIÈRE -->
        <div class="section-title">Situation Financière</div>
        <table class="fin-table">
          <thead>
            <tr><th>Indicateur</th><th>Montant</th></tr>
          </thead>
          <tbody>
            <tr><td>Montant Initial</td><td>${montantI}</td></tr>
            <tr><td>Montant Récupéré</td><td>${montantR}</td></tr>
            <tr><td>Taux de Recouvrement</td><td>${taux}</td></tr>
          </tbody>
        </table>

        <div class="progress-wrap">
          <div class="progress-label">
            <span>Progression du recouvrement</span>
            <span>${taux}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.min(100, parseFloat(taux))}%"></div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <span>Document généré automatiquement — BNA Gestion des Contentieux</span>
          <span>Réf: ${dossier.reference} | ID: ${dossier.idDossier}</span>
        </div>

      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      this.showNotification('Veuillez autoriser les popups pour générer le PDF', 'error');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  }

}
