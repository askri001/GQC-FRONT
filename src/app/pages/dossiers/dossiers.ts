import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Dossier, DOSSIER_STATUT_LABELS, NIVEAU_RISQUE_LABELS } from '../../core/models';

@Component({
  selector: 'app-dossiers',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <h2>Dossiers Contentieux</h2>
          <button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouveau Dossier</button>
        </div>
        <div class="filters">
          <mat-form-field appearance="outline"><mat-label>Recherche</mat-label><input matInput placeholder="Référence..."></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Statut</mat-label>
            <mat-select><mat-option value="EN_COURS">En Cours</mat-option><mat-option value="CLOTURE">Clôturé</mat-option><mat-option value="SUSPENDU">Suspendu</mat-option></mat-select>
          </mat-form-field>
        </div>
        <table mat-table [dataSource]="dossiers()" class="full-width">
          <ng-container matColumnDef="reference"><th mat-header-cell *matHeaderCellDef>Référence</th><td mat-cell *matCellDef="let d">{{ d.reference }}</td></ng-container>
          <ng-container matColumnDef="dateOuverture"><th mat-header-cell *matHeaderCellDef>Date Ouverture</th><td mat-cell *matCellDef="let d">{{ d.dateOuverture | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="montantInitial"><th mat-header-cell *matHeaderCellDef>Montant Initial</th><td mat-cell *matCellDef="let d">{{ d.montantInitial | number:'1.0-0' }} DH</td></ng-container>
          <ng-container matColumnDef="montantRecupere"><th mat-header-cell *matHeaderCellDef>Récupéré</th><td mat-cell *matCellDef="let d">{{ d.montantRecupere | number:'1.0-0' }} DH</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let d"><mat-chip [class]="'statut-'+d.statut.toLowerCase()">{{ getStatutLabel(d.statut) }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="niveauRisque"><th mat-header-cell *matHeaderCellDef>Risque</th><td mat-cell *matCellDef="let d"><mat-chip [class]="'risque-'+d.niveauRisque.toLowerCase()">{{ getRisqueLabel(d.niveauRisque) }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let d"><button mat-icon-button color="primary"><mat-icon>visibility</mat-icon></button><button mat-icon-button><mat-icon>edit</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.filters { display: flex; gap: 16px; margin-bottom: 20px; }.filters mat-form-field { width: 200px; }.full-width { width: 100%; }.statut-en_cours { background: #e3f2fd !important; color: #1565c0 !important; }.statut-cloture { background: #e8f5e9 !important; color: #2e7d32 !important; }.risque-faible { background: #e8f5e9 !important; }.risque-moyen { background: #fff3e0 !important; }.risque-eleve { background: #ffebee !important; }.risque-critique { background: #fce4ec !important; color: #c62828 !important; }`]
})
export class DossiersComponent implements OnInit {
  dossiers = signal<Dossier[]>([]);
  displayedColumns = ['reference', 'dateOuverture', 'montantInitial', 'montantRecupere', 'statut', 'niveauRisque', 'actions'];
  ngOnInit() {
    this.dossiers.set([
      { id: 1, reference: 'DOS-2024-001', dateOuverture: new Date('2024-01-15'), statut: 'EN_COURS', niveauRisque: 'MOYEN', montantInitial: 150000, montantRecupere: 50000, clientId: 1 },
      { id: 2, reference: 'DOS-2024-002', dateOuverture: new Date('2024-02-01'), statut: 'EN_COURS', niveauRisque: 'ELEVE', montantInitial: 250000, montantRecupere: 0, clientId: 2 },
      { id: 3, reference: 'DOS-2024-003', dateOuverture: new Date('2024-01-20'), statut: 'CLOTURE', niveauRisque: 'FAIBLE', montantInitial: 80000, montantRecupere: 80000, clientId: 3 }
    ]);
  }
  getStatutLabel(statut: string): string { return DOSSIER_STATUT_LABELS[statut as keyof typeof DOSSIER_STATUT_LABELS] || statut; }
  getRisqueLabel(risque: string): string { return NIVEAU_RISQUE_LABELS[risque as keyof typeof NIVEAU_RISQUE_LABELS] || risque; }
}

