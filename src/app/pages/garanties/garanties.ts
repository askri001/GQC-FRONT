import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Garantie } from '../../core/models';

@Component({
  selector: 'app-garanties',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header"><h2>Gestion des Garanties</h2><button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouvelle Garantie</button></div>
        <table mat-table [dataSource]="garanties()" class="full-width">
          <ng-container matColumnDef="typeGarantie"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let g">{{ g.typeGarantie }}</td></ng-container>
          <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let g">{{ g.description }}</td></ng-container>
          <ng-container matColumnDef="valeur"><th mat-header-cell *matHeaderCellDef>Valeur</th><td mat-cell *matCellDef="let g">{{ g.valeur | number:'1.0-0' }} DH</td></ng-container>
          <ng-container matColumnDef="statut"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let g"><mat-chip [class]="g.statut?.toLowerCase()">{{ g.statut }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let g"><button mat-icon-button><mat-icon>edit</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styleUrls: ['./garanties.css']
})
export class GarantiesComponent implements OnInit {
  garanties = signal<Garantie[]>([]);
  displayedColumns = ['typeGarantie', 'description', 'valeur', 'statut', 'actions'];
  ngOnInit() {
    this.garanties.set([
      { id: 1, typeGarantie: 'HYPOTHECAIRE' as any, description: 'Terrain agricole', valeur: 500000, statut: 'ACTIVE', dossierId: 1 },
      { id: 2, typeGarantie: 'CAUTION' as any, description: 'Garantie bancaire', valeur: 100000, statut: 'ACTIVE', dossierId: 2 }
    ]);
  }
}

