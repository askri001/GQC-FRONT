import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Mission } from '../../core/models';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header"><h2>Gestion des Missions</h2><button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouvelle Mission</button></div>
        <table mat-table [dataSource]="missions()" class="full-width">
          <ng-container matColumnDef="typeMission"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let m"><mat-chip>{{ m.typeMission }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="dateDebut"><th mat-header-cell *matHeaderCellDef>Date Début</th><td mat-cell *matCellDef="let m">{{ m.dateDebut | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="dateFin"><th mat-header-cell *matHeaderCellDef>Date Fin</th><td mat-cell *matCellDef="let m">{{ m.dateFin | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let m"><mat-chip [class]="'statut-'+m.statut.toLowerCase()">{{ m.statut }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="resultat"><th mat-header-cell *matHeaderCellDef>Résultat</th><td mat-cell *matCellDef="let m">{{ m.resultat || 'En cours' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let m"><button mat-icon-button><mat-icon>visibility</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.full-width { width: 100%; }.statut-en_cours { background: #e3f2fd !important; color: #1565c0 !important; }.statut-terminee { background: #e8f5e9 !important; color: #2e7d32 !important; }`]
})
export class MissionsComponent implements OnInit {
  missions = signal<Mission[]>([]);
  displayedColumns = ['typeMission', 'dateDebut', 'dateFin', 'statut', 'resultat', 'actions'];
  ngOnInit() {
    this.missions.set([
      { id: 1, typeMission: 'CONSEIL_JURIDIQUE' as any, dateDebut: new Date('2024-01-10'), dateFin: new Date('2024-01-15'), statut: 'TERMINEE', resultat: 'Favorable', prestataireId: 1, dossierId: 1 },
      { id: 2, typeMission: 'EXECUTION_JUGEMENT' as any, dateDebut: new Date('2024-02-01'), dateFin: new Date('2024-02-15'), statut: 'EN_COURS', resultat: '', prestataireId: 2, dossierId: 2 }
    ]);
  }
}

