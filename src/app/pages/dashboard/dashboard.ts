import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats, Dossier } from '../../core/models';

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
    BaseChartDirective
  ],
  template: `
    <div class="dashboard-container">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card">
          <div class="kpi-icon dossiers">
            <mat-icon>folder</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().totalDossiers }}</span>
            <span class="kpi-label">Total Dossiers</span>
          </div>
        </mat-card>

        <mat-card class="kpi-card">
          <div class="kpi-icon actifs">
            <mat-icon>play_circle</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().dossiersActifs }}</span>
            <span class="kpi-label">Dossiers Actifs</span>
          </div>
        </mat-card>

        <mat-card class="kpi-card">
          <div class="kpi-icon recovered">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatCurrency(stats().montantTotalRecupere) }}</span>
            <span class="kpi-label">Montant Récupéré</span>
          </div>
        </mat-card>

        <mat-card class="kpi-card">
          <div class="kpi-icon rate">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().tauxRecouvrement }}%</span>
            <span class="kpi-label">Taux de Recouvrement</span>
          </div>
        </mat-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Répartition des Dossiers</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [data]="doughnutChartData"
              [type]="doughnutChartType"
              [options]="doughnutChartOptions">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Évolution des Recouvrements</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [data]="lineChartData"
              [type]="lineChartType"
              [options]="lineChartOptions">
            </canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent Dossiers -->
      <mat-card class="recent-card">
        <mat-card-header>
          <mat-card-title>Dossiers Récents</mat-card-title>
          <button mat-button color="primary" routerLink="/dossiers">Voir tout</button>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recentDossiers()" class="full-width">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>Référence</th>
              <td mat-cell *matCellDef="let dossier">{{ dossier.reference }}</td>
            </ng-container>

            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let dossier">{{ dossier.client?.nom }} {{ dossier.client?.prenom }}</td>
            </ng-container>

            <ng-container matColumnDef="montant">
              <th mat-header-cell *matHeaderCellDef>Montant</th>
              <td mat-cell *matCellDef="let dossier">{{ formatCurrency(dossier.montantInitial) }}</td>
            </ng-container>

            <ng-container matColumnDef="statut">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let dossier">
                <mat-chip [class]="'statut-' + dossier.statut.toLowerCase()">
                  {{ getStatutLabel(dossier.statut) }}
                </mat-chip>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
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
      gap: 20px;
      border-radius: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
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
  stats = signal<DashboardStats>({
    totalDossiers: 0,
    dossiersActifs: 0,
    dossiersClotures: 0,
    montantTotalRecupere: 0,
    montantTotalImpaye: 0,
    tauxRecouvrement: 0,
    missionsEnCours: 0,
    missionsTerminees: 0,
    facturesEnAttente: 0,
    facturesPayees: 0,
    prestatairesActifs: 0,
    clientsActifs: 0
  });

  recentDossiers = signal<Dossier[]>([]);
  displayedColumns = ['reference', 'client', 'montant', 'statut'];

  // Chart configurations
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
  lineChartData: ChartData<'line'> = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Montant Récupéré',
        data: [65000, 59000, 80000, 81000, 56000, 95000],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
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

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Mock data for demonstration
    this.stats.set({
      totalDossiers: 156,
      dossiersActifs: 89,
      dossiersClotures: 45,
      montantTotalRecupere: 2450000,
      montantTotalImpaye: 3200000,
      tauxRecouvrement: 43,
      missionsEnCours: 12,
      missionsTerminees: 78,
      facturesEnAttente: 15,
      facturesPayees: 63,
      prestatairesActifs: 24,
      clientsActifs: 89
    });

    this.recentDossiers.set([
      { id: 1, reference: 'DOS-2024-001', dateOuverture: new Date(), statut: 'EN_COURS', niveauRisque: 'MOYEN', montantInitial: 150000, montantRecupere: 50000, clientId: 1 },
      { id: 2, reference: 'DOS-2024-002', dateOuverture: new Date(), statut: 'EN_COURS', niveauRisque: 'ELEVE', montantInitial: 250000, montantRecupere: 0, clientId: 2 },
      { id: 3, reference: 'DOS-2024-003', dateOuverture: new Date(), statut: 'CLOTURE', niveauRisque: 'FAIBLE', montantInitial: 80000, montantRecupere: 80000, clientId: 3 },
      { id: 4, reference: 'DOS-2024-004', dateOuverture: new Date(), statut: 'EN_ATTENTE', niveauRisque: 'CRITIQUE', montantInitial: 500000, montantRecupere: 0, clientId: 4 },
      { id: 5, reference: 'DOS-2024-005', dateOuverture: new Date(), statut: 'SUSPENDU', niveauRisque: 'MOYEN', montantInitial: 95000, montantRecupere: 25000, clientId: 5 }
    ]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(value);
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'EN_COURS': 'En Cours',
      'CLOTURE': 'Clôturé',
      'SUSPENDU': 'Suspendu',
      'EN_ATTENTE': 'En Attente'
    };
    return labels[statut] || statut;
  }
}

