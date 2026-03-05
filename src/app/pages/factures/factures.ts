import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Facture } from '../../core/models';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header"><h2>Gestion des Factures</h2><button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouvelle Facture</button></div>
        <table mat-table [dataSource]="factures()" class="full-width">
          <ng-container matColumnDef="numero"><th mat-header-cell *matHeaderCellDef>N° Facture</th><td mat-cell *matCellDef="let f">{{ f.numero }}</td></ng-container>
          <ng-container matColumnDef="dateEmission"><th mat-header-cell *matHeaderCellDef>Date Émission</th><td mat-cell *matCellDef="let f">{{ f.dateEmission | date:'dd/MM/yyyy' }}</td></ng-container>
          <ng-container matColumnDef="montant"><th mat-header-cell *matHeaderCellDef>Montant</th><td mat-cell *matCellDef="let f"><strong>{{ f.montant | number:'1.0-0' }} DH</strong></td></ng-container>
          <ng-container matColumnDef="typeFacture"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let f"><mat-chip>{{ f.typeFacture }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let f"><mat-chip [class]="'statut-'+f.statut.toLowerCase()">{{ f.statut }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let f"><button mat-icon-button><mat-icon>visibility</mat-icon></button><button mat-icon-button color="primary"><mat-icon>check</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.full-width { width: 100%; }.statut-payee { background: #e8f5e9 !important; color: #2e7d32 !important; }.statut-en_attente { background: #fff3e0 !important; color: #ef6c00 !important; }`]
})
export class FacturesComponent implements OnInit {
  factures = signal<Facture[]>([]);
  displayedColumns = ['numero', 'dateEmission', 'montant', 'typeFacture', 'statut', 'actions'];
  ngOnInit() {
    this.factures.set([
      { id: 1, numero: 'FAC-2024-001', dateEmission: new Date('2024-01-15'), montant: 2500, typeFacture: 'HONORAIRES', statut: 'PAYEE', missionId: 1 },
      { id: 2, numero: 'FAC-2024-002', dateEmission: new Date('2024-02-01'), montant: 1500, typeFacture: 'FRAIS', statut: 'EN_ATTENTE', missionId: 2 }
    ]);
  }
}

