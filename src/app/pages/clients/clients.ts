import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Client } from '../../core/models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header">
          <h2>Gestion des Clients</h2>
          <button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouveau Client</button>
        </div>
        <div class="filters">
          <mat-form-field appearance="outline"><mat-label>Rechercher</mat-label><input matInput placeholder="Nom, CIN..."><mat-icon matSuffix>search</mat-icon></mat-form-field>
        </div>
        <table mat-table [dataSource]="clients()" class="full-width">
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let c">{{ c.nom }}</td></ng-container>
          <ng-container matColumnDef="prenom"><th mat-header-cell *matHeaderCellDef>Prénom</th><td mat-cell *matCellDef="let c">{{ c.prenom }}</td></ng-container>
          <ng-container matColumnDef="cin"><th mat-header-cell *matHeaderCellDef>CIN</th><td mat-cell *matCellDef="let c">{{ c.cin }}</td></ng-container>
          <ng-container matColumnDef="tel"><th mat-header-cell *matHeaderCellDef>Téléphone</th><td mat-cell *matCellDef="let c">{{ c.tel }}</td></ng-container>
          <ng-container matColumnDef="adresse"><th mat-header-cell *matHeaderCellDef>Adresse</th><td mat-cell *matCellDef="let c">{{ c.adresse }}</td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let c"><button mat-icon-button color="primary"><mat-icon>edit</mat-icon></button><button mat-icon-button color="warn"><mat-icon>delete</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.filters { margin-bottom: 20px; }.filters mat-form-field { width: 300px; }.full-width { width: 100%; }`]
})
export class ClientsComponent implements OnInit {
  clients = signal<Client[]>([]);
  displayedColumns = ['nom', 'prenom', 'cin', 'tel', 'adresse', 'actions'];
  ngOnInit() {
    this.clients.set([
      { id: 1, nom: 'Bennani', prenom: 'Ahmed', cin: 'AB123456', tel: '0661234567', adresse: 'Casablanca, Morocco', dateCreation: new Date() },
      { id: 2, nom: 'Alami', prenom: 'Fatima', cin: 'CD789012', tel: '0662345678', adresse: 'Rabat, Morocco', dateCreation: new Date() }
    ]);
  }
}

