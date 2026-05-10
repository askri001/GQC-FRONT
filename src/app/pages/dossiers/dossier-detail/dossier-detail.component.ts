import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DossierService } from '../../../core/services/dossier.service';
import { AffaireService } from '../../../core/services/affaire.service';
import { RisqueService } from '../../../core/services/risque.service';
import { GarantieService } from '../../../core/services/garantie.service';
import { AudienceService } from '../../../core/services/audience.service';
import { MissionService } from '../../../core/services/mission.service';
import { FactureService } from '../../../core/services/facture.service';
import { AuthService } from '../../../core/services/auth.service';

import { Dossier, DOSSIER_STATUT_LABELS, NIVEAU_RISQUE_LABELS } from '../../../core/models/dossier.model';
import { Affaire, STATUT_AFFAIRE_LABELS } from '../../../core/models/affaire.model';
import { Risque } from '../../../core/models/risque.model';
import { Garantie, TYPE_GARANTIE_LABELS, STATUT_GARANTIE_LABELS } from '../../../core/models/garantie.model';
import { Audience } from '../../../core/models/audience.model';
import { Mission, TYPE_MISSION_LABELS, STATUT_MISSION_LABELS } from '../../../core/models/mission.model';
import { Facture, STATUT_FACTURE_LABELS, TYPE_FACTURE_LABELS } from '../../../core/models/facture.model';

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTabsModule,
    MatTableModule, MatTooltipModule
  ],
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.css']
})
export class DossierDetailComponent implements OnInit {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private snackBar     = inject(MatSnackBar);
  readonly authService = inject(AuthService);

  private dossierService  = inject(DossierService);
  private affaireService  = inject(AffaireService);
  private risqueService   = inject(RisqueService);
  private garantieService = inject(GarantieService);
  private audienceService = inject(AudienceService);
  private missionService  = inject(MissionService);
  private factureService  = inject(FactureService);

  // ── State ──────────────────────────────────────────────────────
  dossier   = signal<Dossier | null>(null);
  affaires  = signal<Affaire[]>([]);
  risques   = signal<Risque[]>([]);
  garanties = signal<Garantie[]>([]);
  audiences = signal<Audience[]>([]);
  missions  = signal<Mission[]>([]);
  factures  = signal<Facture[]>([]);
  loading   = signal(true);
  dossierId = 0;

  // ── Labels ─────────────────────────────────────────────────────
  statutLabels         = DOSSIER_STATUT_LABELS      as Record<string, string>;
  risqueLabels         = NIVEAU_RISQUE_LABELS        as Record<string, string>;
  affaireLabels        = STATUT_AFFAIRE_LABELS       as Record<string, string>;
  garantieTypeLabels   = TYPE_GARANTIE_LABELS        as Record<string, string>;
  garantieStatutLabels = STATUT_GARANTIE_LABELS      as Record<string, string>;
  missionTypeLabels    = TYPE_MISSION_LABELS         as Record<string, string>;
  missionStatutLabels  = STATUT_MISSION_LABELS       as Record<string, string>;
  factureStatutLabels  = STATUT_FACTURE_LABELS       as Record<string, string>;
  factureTypeLabels    = TYPE_FACTURE_LABELS         as Record<string, string>;

  // ── Table columns ──────────────────────────────────────────────
  affaireCols  = ['numeroProcedure', 'dateDebut', 'tribunal', 'statut', 'jugement'];
  risqueCols   = ['montantPrincipal', 'montantInteret', 'montantTotal', 'tauxInteret', 'dateEcheance'];
  garantieCols = ['typeGarantie', 'description', 'valeur', 'statut'];
  audienceCols = ['dateAudience', 'typeAudience', 'decision', 'observation'];
  missionCols  = ['typeMission', 'dateDebut', 'dateFin', 'statut', 'resultat'];
  factureCols  = ['numero', 'dateEmission', 'montant', 'typeFacture', 'statut'];

  ngOnInit(): void {
    this.dossierId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.dossierId) { this.router.navigate(['/dossiers']); return; }
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);

    this.dossierService.getById(this.dossierId).subscribe({
      next: (d) => {
        this.dossier.set(d);
        this.loadRelated();
      },
      error: () => {
        this.snackBar.open('Dossier introuvable', 'OK', { duration: 3000 });
        this.router.navigate(['/dossiers']);
      }
    });
  }

  private loadRelated(): void {
    // Load affaires for this dossier
    this.affaireService.getByDossierId(this.dossierId).subscribe({
      next: (data) => {
        this.affaires.set(data);
        // Once we have affaires, load audiences and missions per affaire
        const affaireIds = data.map(a => a.idAffaire!).filter(Boolean);
        if (affaireIds.length > 0) {
          this.loadAudiencesAndMissions(affaireIds);
        } else {
          this.loading.set(false);
        }
      },
      error: () => { this.affaires.set([]); this.loading.set(false); }
    });

    // Load risques for this dossier
    this.risqueService.getByDossierId(this.dossierId).subscribe({
      next: (data) => {
        this.risques.set(data);
        // Load garanties for each risque
        if (data.length > 0) {
          this.garantieService.getAll().subscribe({
            next: (all) => this.garanties.set(all.filter(g => data.some(r => r.id === g.risqueId))),
            error: () => this.garanties.set([])
          });
        }
      },
      error: () => this.risques.set([])
    });

    // Load factures — filter by missions of this dossier (done after missions load)
    this.factureService.getAll().subscribe({
      next: (all) => this.factures.set(all),
      error: () => this.factures.set([])
    });
  }

  private loadAudiencesAndMissions(affaireIds: number[]): void {
    const audienceRequests = affaireIds.map(id => this.audienceService.getByAffaireId(id));
    const missionRequests  = affaireIds.map(id => this.missionService.getByAffaireId(id));

    forkJoin(audienceRequests).subscribe({
      next: (results) => this.audiences.set(results.flat()),
      error: () => this.audiences.set([])
    });

    forkJoin(missionRequests).subscribe({
      next: (results) => {
        this.missions.set(results.flat());
        this.loading.set(false);
      },
      error: () => { this.missions.set([]); this.loading.set(false); }
    });
  }

  // ── Recovery rate ──────────────────────────────────────────────
  recoveryRate(): number {
    const d = this.dossier();
    if (!d || !d.montantInitial) return 0;
    return Math.min(100, Math.round((d.montantRecupere / d.montantInitial) * 100));
  }

  // ── Helpers ────────────────────────────────────────────────────
  formatCurrency(v: number): string {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      EN_COURS: 'chip-en-cours', CLOTURE: 'chip-cloture', SUSPENDU: 'chip-suspendu',
      TRANSFERE: 'chip-transfere', EN_ATTENTE: 'chip-en-attente', OUVERT: 'chip-ouvert', VALIDE: 'chip-valide'
    };
    return map[statut] ?? '';
  }

  getRisqueClass(r: string): string {
    const map: Record<string, string> = { FAIBLE: 'chip-faible', MOYEN: 'chip-moyen', ELEVE: 'chip-eleve', CRITIQUE: 'chip-critique' };
    return map[r] ?? '';
  }

  goBack(): void { this.router.navigate(['/dossiers']); }

  // ── PDF export (reuses existing logic) ────────────────────────
  exportPdf(): void {
    const d = this.dossier();
    if (!d) return;
    const client  = `${d.clientNom ?? ''} ${d.clientPrenom ?? ''}`.trim() || `#${d.clientId}`;
    const charge  = d.chargeDossierNom ? `${d.chargeDossierPrenom ?? ''} ${d.chargeDossierNom}`.trim() : '—';
    const statut  = this.statutLabels[d.statut as keyof typeof this.statutLabels] ?? d.statut;
    const risque  = this.risqueLabels[d.niveauRisque as keyof typeof this.risqueLabels] ?? d.niveauRisque;
    const dateOuv = d.dateOuverture ? new Date(d.dateOuverture).toLocaleDateString('fr-TN') : '—';
    const dateClo = d.dateCloture   ? new Date(d.dateCloture).toLocaleDateString('fr-TN')   : '—';
    const taux    = this.recoveryRate() + '%';
    const now     = new Date().toLocaleDateString('fr-TN', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
      <title>Dossier ${d.reference}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;padding:40px}
        .header{display:flex;justify-content:space-between;border-bottom:3px solid #00966E;padding-bottom:20px;margin-bottom:28px}
        .header h1{font-size:22px;color:#00966E;font-weight:700}
        .ref{font-size:16px;font-weight:700}
        .section-title{font-size:13px;font-weight:700;color:#00966E;text-transform:uppercase;border-left:4px solid #00966E;padding-left:10px;margin:24px 0 12px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 32px}
        .field label{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:2px;display:block}
        .field span{font-size:13px;font-weight:600}
        .fin-table{width:100%;border-collapse:collapse;margin-top:8px}
        .fin-table th{background:#00966E;color:#fff;padding:9px 14px;text-align:left;font-size:12px}
        .fin-table td{padding:9px 14px;border-bottom:1px solid #e8f3ee;font-size:13px}
        .progress-bar{height:10px;background:#e0f5ee;border-radius:5px;overflow:hidden;margin-top:8px}
        .progress-fill{height:100%;background:#00966E;border-radius:5px}
        .footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:11px;color:#999}
      </style></head><body>
      <div class="header">
        <div><h1>Dossier Contentieux</h1><p>BNA — Gestion des Contentieux</p></div>
        <div style="text-align:right"><div class="ref">${d.reference}</div><div style="margin-top:6px">Généré le ${now}</div></div>
      </div>
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
        <tbody>
          <tr><td>Montant Initial</td><td>${this.formatCurrency(d.montantInitial)}</td></tr>
          <tr><td>Montant Récupéré</td><td>${this.formatCurrency(d.montantRecupere)}</td></tr>
          <tr><td>Taux de Recouvrement</td><td>${taux}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px">
          <span>Progression</span><span>${taux}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${this.recoveryRate()}%"></div></div>
      </div>
      <div class="footer">
        <span>Document généré automatiquement — BNA</span>
        <span>Réf: ${d.reference} | ID: ${d.idDossier}</span>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { this.snackBar.open('Autorisez les popups pour générer le PDF', 'OK', { duration: 3000 }); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }
}
