import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Affaire } from '../../core/models';

@Component({
  selector: 'app-affaires',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header"><h2>Gestion des Affaires</h2><button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouvelle Affaire</button></div>
        <table mat-table [dataSource]="affaires()" class="full-width">
          <ng-container matColumnDef="numeroProcedure"><th mat-header-cell *matHeaderCellDef>N° Procédure</th><td mat-cell *matCellDef="let a">{{ a.numeroProcedure }}</td></ng-container>
          <ng-container matColumnDef="dateDebut"><th mat-header-cell *matHeaderCellDef>Date Début</th><td mat-cell *matCellDef="let a">{{ a.dateDebut | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="tribunal"><th mat-header-cell *matHeaderCellDef>Tribunal</th><td mat-cell *matCellDef="let a">{{ a.tribunal }}</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let a"><mat-chip>{{ a.statut }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="jugement"><th mat-header-cell *matHeaderCellDef>Jugement</th><td mat-cell *matCellDef="let a">{{ a.jugement || 'En cours' }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let a"></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styleUrls: ['./affaires.css']
})
export class AffairesComponent implements OnInit {
  affaires = signal<Affaire[]>([]);
  displayedColumns = ['numeroProcedure', 'dateDebut', 'tribunal', 'statut', 'jugement', 'actions'];
  ngOnInit() {
    this.affaires.set([
      { id: 1, numeroProcedure: 'PROC-2024-001', dateDebut: new Date('2024-01-15'), statut: 'EN_COURS', tribunal: 'Tribunal de Casablanca', dossierId: 1 },
      { id: 2, numeroProcedure: 'PROC-2024-002', dateDebut: new Date('2024-02-01'), statut: 'JUGEE', tribunal: 'Tribunal de Rabat', jugement: 'Favorable', dossierId: 2 }
    ]);
  }
}

