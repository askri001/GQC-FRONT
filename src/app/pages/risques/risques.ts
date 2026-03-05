import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Risque } from '../../core/models';

@Component({
  selector: 'app-risques',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header"><h2>Gestion des Risques</h2><button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouveau Risque</button></div>
        <table mat-table [dataSource]="risques()" class="full-width">
          <ng-container matColumnDef="montantPrincipal"><th mat-header-cell *matHeaderCellDef>Montant Principal</th><td mat-cell *matCellDef="let r">{{ r.montantPrincipal | number:'1.0-0' }} DH</td></ng-container>
          <ng-container matColumnDef="montantInteret"><th mat-header-cell *matHeaderCellDef>Intérêts</th><td mat-cell *matCellDef="let r">{{ r.montantInteret | number:'1.0-0' }} DH</td></ng-container>
          <ng-container matColumnDef="montantTotal"><th mat-header-cell *matHeaderCellDef>Montant Total</th><td mat-cell *matCellDef="let r"><strong>{{ r.montantTotal | number:'1.0-0' }} DH</strong></td></ng-container>
          <ng-container matColumnDef="dateContrat"><th mat-header-cell *matHeaderCellDef>Date Contrat</th><td mat-cell *matCellDef="let r">{{ r.dateContrat | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="dateEcheance"><th mat-header-cell *matHeaderCellDef>Échéance</th><td mat-cell *matCellDef="let r">{{ r.dateEcheance | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="tauxInteret"><th mat-header-cell *matHeaderCellDef>Taux</th><td mat-cell *matCellDef="let r">{{ r.tauxInteret }}%</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let r"><button mat-icon-button><mat-icon>edit</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.full-width { width: 100%; }`]
})
export class RisquesComponent implements OnInit {
  risques = signal<Risque[]>([]);
  displayedColumns = ['montantPrincipal', 'montantInteret', 'montantTotal', 'dateContrat', 'dateEcheance', 'tauxInteret', 'actions'];
  ngOnInit() {
    this.risques.set([
      { id: 1, montantPrincipal: 100000, montantInteret: 15000, montantTotal: 115000, dateContrat: new Date('2023-01-01'), dateEcheance: new Date('2024-12-31'), tauxInteret: 5.5, dossierId: 1 },
      { id: 2, montantPrincipal: 250000, montantInteret: 50000, montantTotal: 300000, dateContrat: new Date('2022-06-15'), dateEcheance: new Date('2024-06-15'), tauxInteret: 6, dossierId: 2 }
    ]);
  }
}

