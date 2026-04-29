import { Component, OnInit, signal, inject } from '@angular/core';
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
import { DashboardStats } from '../../core/models';

interface DashboardDossier {
  id: number;
  reference: string;
  dateOuverture: Date;
  statut: string;
  niveauRisque: string;
  montantInitial: number;
  montantRecupere: number;
  clientId: number;
  client?: { id: number; nom: string; prenom: string };
}

const MOCK_STATS: DashboardStats = {
  totalDossiers: 124,
  dossiersActifs: 78,
  dossiersClotures: 32,
  montantTotalRecupere: 2850000,
  montantTotalImpaye: 1200000,
  tauxRecouvrement: 70.4,
  missionsEnCours: 15,
  missionsTerminees: 42,
  facturesEnAttente: 8,
  facturesPayees: 56,
  prestatairesActifs: 12,
  clientsActifs: 89
};

const MOCK_RECENT_DOSSIERS: DashboardDossier[] = [
  { id: 1, reference: 'DOS-2024-001', dateOuverture: new Date('2024-01-15'), statut: 'EN_COURS', niveauRisque: 'MOYEN', montantInitial: 150000, montantRecupere: 75000, clientId: 1, client: { id: 1, nom: 'Ben Ali', prenom: 'Mohamed' } },
  { id: 2, reference: 'DOS-2024-002', dateOuverture: new Date('2024-02-20'), statut: 'CLOTURE', niveauRisque: 'FAIBLE', montantInitial: 85000, montantRecupere: 85000, clientId: 2, client: { id: 2, nom: 'Trabelsi', prenom: 'Fatima' } },
  { id: 3, reference: 'DOS-2024-003', dateOuverture: new Date('2024-03-05'), statut: 'EN_COURS', niveauRisque: 'ELEVE', montantInitial: 320000, montantRecupere: 45000, clientId: 3, client: { id: 3, nom: 'Guesmi', prenom: 'Ahmed' } },
  { id: 4, reference: 'DOS-2024-004', dateOuverture: new Date('2024-03-18'), statut: 'SUSPENDU', niveauRisque: 'CRITIQUE', montantInitial: 500000, montantRecupere: 0, clientId: 4, client: { id: 4, nom: 'Jaziri', prenom: 'Sonia' } },
  { id: 5, reference: 'DOS-2024-005', dateOuverture: new Date('2024-04-01'), statut: 'EN_ATTENTE', niveauRisque: 'FAIBLE', montantInitial: 45000, montantRecupere: 0, clientId: 5, client: { id: 5, nom: 'Mejri', prenom: 'Karim' } }
];

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
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  stats = signal<DashboardStats>(MOCK_STATS);

  recentDossiers = signal<DashboardDossier[]>(MOCK_RECENT_DOSSIERS);
  displayedColumns = ['reference', 'client', 'montant', 'statut'];

  // Chart configurations (static for minimal change)
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
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Load stats from API - fallback to mock data on error
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (err) => {
        console.warn('API unavailable, using mock stats:', err.message);
        // Keep mock data already set
      }
    });

    // Load recent dossiers from API - fallback to mock data on error
    this.api.getRecentDossiers(5).subscribe({
      next: (data) => {
        this.recentDossiers.set(data as DashboardDossier[]);
      },
      error: (err) => {
        console.warn('API unavailable, using mock dossiers:', err.message);
        // Keep mock data already set
      }
    });
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

