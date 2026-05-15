import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DossierService } from '../../core/services/dossier.service';
import { DashboardStats, Dossier } from '../../core/models';
import { DOSSIER_STATUT_LABELS } from '../../core/models/dossier.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  template: `
    <!-- ── RESPONSABLE / ADMIN dashboard ──────────────────── -->
    @if (!authService.hasRole('ROLE_CHARGEDOSSIER') || authService.hasRole('ROLE_RESPONSABLE') || authService.hasRole('ROLE_ADMIN')) {
    <div class="dashboard-container">

      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <div class="kpi-icon dossiers"><mat-icon>folder</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().totalDossiers }}</span>
            <span class="kpi-label">Total Dossiers</span>
          </div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-icon actifs"><mat-icon>play_circle</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().dossiersActifs }}</span>
            <span class="kpi-label">Dossiers Actifs</span>
          </div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-icon recovered"><mat-icon>payments</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatCurrency(stats().montantTotalRecupere) }}</span>
            <span class="kpi-label">Montant Récupéré</span>
          </div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-icon rate"><mat-icon>trending_up</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatPercentage(stats().tauxRecouvrement) }}%</span>
            <span class="kpi-label">Taux de Recouvrement</span>
          </div>
        </mat-card>
      </div>

      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Répartition des Dossiers</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [data]="doughnutChartData" [type]="doughnutChartType" [options]="doughnutChartOptions"></canvas>
          </mat-card-content>
        </mat-card>
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Évolution des Recouvrements</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [data]="lineChartData" [type]="lineChartType" [options]="lineChartOptions"></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="recent-card">
        <mat-card-header>
          <mat-card-title>Dossiers Récents</mat-card-title>
          <button mat-button color="primary" routerLink="/dossiers">Voir tout</button>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recentDossiers()" class="full-width">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>Référence</th>
              <td mat-cell *matCellDef="let d">{{ d.reference }}</td>
            </ng-container>
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let d">{{ d.clientNom }} {{ d.clientPrenom }}</td>
            </ng-container>
            <ng-container matColumnDef="montant">
              <th mat-header-cell *matHeaderCellDef>Montant</th>
              <td mat-cell *matCellDef="let d">{{ formatCurrency(d.montantInitial) }}</td>
            </ng-container>
            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let d">
                <mat-chip [class]="'statut-' + d.statut.toLowerCase()">{{ getStatutLabel(d.statut) }}</mat-chip>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
    }

    <!-- ── CHARGEDOSSIER dashboard ─────────────────────────── -->
    @if (authService.hasRole('ROLE_CHARGEDOSSIER') && !authService.hasRole('ROLE_RESPONSABLE') && !authService.hasRole('ROLE_ADMIN')) {
    <div class="dashboard-container">

      <!-- Welcome banner -->
      <div class="welcome-banner">
        <mat-icon>waving_hand</mat-icon>
        <div>
          <h2>Bonjour, {{ currentUsername() }}</h2>
          <p>Voici un aperçu de votre activité</p>
        </div>
      </div>

      <!-- KPI cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <div class="kpi-icon dossiers"><mat-icon>folder</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ myDossiers().length }}</span>
            <span class="kpi-label">Mes Dossiers</span>
          </div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-icon actifs"><mat-icon>play_circle</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ myDossiersActifs() }}</span>
            <span class="kpi-label">En Cours</span>
          </div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-icon recovered"><mat-icon>gavel</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ myAffaires().length }}</span>
            <span class="kpi-label">Affaires</span>
          </div>
        </mat-card>
        <mat-card class="kpi-card">
          <div class="kpi-icon rate"><mat-icon>event</mat-icon></div>
          <div class="kpi-content">
            <span class="kpi-value">{{ myAudiences().length }}</span>
            <span class="kpi-label">Audiences</span>
          </div>
        </mat-card>
      </div>

      <!-- My dossiers table -->
      <mat-card class="recent-card">
        <mat-card-header>
          <mat-card-title>Mes Dossiers Assignés</mat-card-title>
          <button mat-button color="primary" routerLink="/dossiers">Voir tout</button>
        </mat-card-header>
        <mat-card-content>
          @if (loadingCharge()) {
            <div class="loading-row"><mat-spinner diameter="32"></mat-spinner></div>
          } @else if (myDossiers().length === 0) {
            <div class="empty-row"><mat-icon>folder_open</mat-icon><p>Aucun dossier assigné</p></div>
          } @else {
            <table mat-table [dataSource]="myDossiers().slice(0, 8)" class="full-width">
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Référence</th>
                <td mat-cell *matCellDef="let d">
                  <a class="ref-link" [routerLink]="['/dossiers', d.idDossier]">{{ d.reference }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="client">
                <th mat-header-cell *matHeaderCellDef>Client</th>
                <td mat-cell *matCellDef="let d">{{ d.clientNom }} {{ d.clientPrenom }}</td>
              </ng-container>
              <ng-container matColumnDef="montant">
                <th mat-header-cell *matHeaderCellDef>Montant Initial</th>
                <td mat-cell *matCellDef="let d">{{ formatCurrency(d.montantInitial) }}</td>
              </ng-container>
              <ng-container matColumnDef="statut">
                <th mat-header-cell *matHeaderCellDef>Statut</th>
                <td mat-cell *matCellDef="let d">
                  <mat-chip [class]="'statut-' + d.statut.toLowerCase()">{{ getStatutLabel(d.statut) }}</mat-chip>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>

    </div>
    }
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
      text-align: center;
    }

    .kpi-card:hover {

      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .kpi-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #fff;
    }

    .kpi-icon.dossiers { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .kpi-icon.actifs { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .kpi-icon.recovered { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .kpi-icon.rate { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      color: #2e7d32;
    }

    .kpi-label {
      font-size: 14px;
      color: #666;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
    }

    .chart-card {
      border-radius: 12px;
    }

    .chart-card mat-card-header {
      margin-bottom: 16px;
    }

    .chart-card canvas {
      max-height: 300px;
    }

    .recent-card {
      border-radius: 12px;
    }

    .recent-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .full-width {
      width: 100%;
    }

    .statut-en_cours { background: #e3f2fd !important; color: #1565c0 !important; }
    .statut-cloture { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .statut-suspendu { background: #fff3e0 !important; color: #ef6c00 !important; }
  `]
})
export class DashboardComponent implements OnInit {
  private api           = inject(ApiService);
  readonly authService  = inject(AuthService);
  private dossierService = inject(DossierService);

  // ── Responsable/Admin state ────────────────────────────────
  stats = signal<DashboardStats>({
    totalDossiers: 0, dossiersActifs: 0, dossiersClotures: 0,
    montantTotalRecupere: 0, montantTotalImpaye: 0, tauxRecouvrement: 0,
    missionsEnCours: 0, missionsTerminees: 0, facturesEnAttente: 0,
    facturesPayees: 0, prestatairesActifs: 0, clientsActifs: 0
  });
  recentDossiers = signal<Dossier[]>([]);

  // ── ChargeDossier state ────────────────────────────────────
  myDossiers    = signal<Dossier[]>([]);
  myAffaires    = signal<any[]>([]);
  myAudiences   = signal<any[]>([]);
  loadingCharge = signal(false);
  currentUsername = signal('');

  myDossiersActifs = () => this.myDossiers().filter(d => d.statut === 'EN_COURS').length;
  displayedColumns = ['reference', 'client', 'montant', 'statut'];

  
  doughnutChartType: ChartType = 'doughnut';
  doughnutChartData: ChartData<'doughnut'> = {
    labels: ['En Cours', 'Clôturés', 'Suspendus', 'En Attente'],
    datasets: [{
      data: [45, 30, 15, 10],
      backgroundColor: ['#667eea', '#43e97b', '#f093fb', '#ffa726'],
      borderWidth: 0
    }]
  };
  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  lineChartType: ChartType = 'line';
  // Placeholder data — connect to a real trend endpoint when available
  lineChartData: ChartData<'line'> = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Montant Récupéré',
      data: [65000, 59000, 80000, 81000, 56000, 95000],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  ngOnInit() {
    const token = this.authService.getAccessToken();
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split('.')[1]));
        this.currentUsername.set(payload.sub || '');
      } catch { }
    }

    if (this.authService.hasRole('ROLE_CHARGEDOSSIER') &&
        !this.authService.hasRole('ROLE_RESPONSABLE') &&
        !this.authService.hasRole('ROLE_ADMIN')) {
      this.loadChargeDossierData();
    } else {
      this.loadDashboardData();
    }
  }

  loadChargeDossierData() {
    this.loadingCharge.set(true);
    const userId = Number(localStorage.getItem('auth_user_id'));
    this.dossierService.getAll().subscribe({
      next: (data) => {
        // Filter by chargeUserId — fall back to all if none assigned yet
        const mine = userId ? data.filter(d => d.chargeDossierId === userId) : data;
        this.myDossiers.set(mine.length > 0 ? mine : data);
        this.loadingCharge.set(false);
      },
      error: () => this.loadingCharge.set(false)
    });
    // Load affaires and audiences for context
    this.api.get<any[]>('/affaires').subscribe({
      next: (data) => this.myAffaires.set(data ?? []),
      error: () => {}
    });
    this.api.get<any[]>('/audiences').subscribe({
      next: (data) => this.myAudiences.set(data ?? []),
      error: () => {}
    });
  }

  loadDashboardData() {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.doughnutChartData = {
          labels: ['En Cours', 'Clôturés', 'Autres'],
          datasets: [{
            data: [data.dossiersActifs, data.dossiersClotures,
                   data.totalDossiers - data.dossiersActifs - data.dossiersClotures],
            backgroundColor: ['#667eea', '#43e97b', '#ffa726'],
            borderWidth: 0
          }]
        };
      },
      error: (err) => console.error('Error loading dashboard stats:', err)
    });

    this.api.getMonthlyRecovery().subscribe({
      next: (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        this.lineChartData = {
          labels,
          datasets: [{
            label: 'Montant Récupéré',
            data: values,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
      },
      error: (err) => console.error('Error loading monthly recovery:', err)
    });

    this.api.getRecentDossiers(5).subscribe({
      next: (data) => this.recentDossiers.set(data),
      error: (err) => console.error('Error loading recent dossiers:', err)
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(value);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }


  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'EN_COURS': 'En Cours',
      'CLOTURE': 'Clôturé',
      'SUSPENDU': 'Suspendu',
      'EN_ATTENTE': 'En Attente',
      'EN_ATTENTE_VALIDATION': 'En Attente de Validation',
      'EN_ATTENTE_CLOTURE': 'En Attente de Clôture',
      'VALIDE': 'Validé',
      'TRANSFERE': 'Transféré',
      'OUVERT': 'Ouvert'
    };
    return labels[statut] || statut;
  }
}
