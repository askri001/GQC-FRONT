import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Prestataire } from '../../core/models';

@Component({
  selector: 'app-prestataires',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule],
  template: `
    <div class="page-container">
      <mat-card class="page-card">
        <div class="card-header"><h2>Gestion des Prestataires</h2><button mat-raised-button color="primary"><mat-icon>add</mat-icon> Nouveau Prestataire</button></div>
        <table mat-table [dataSource]="prestataires()" class="full-width">
          <ng-container matColumnDef="typePrestataire"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let p"><mat-chip>{{ p.typePrestataire }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="nom"><th mat-header-cell *matHeaderCellDef>Nom</th><td mat-cell *matCellDef="let p">{{ p.nom }} {{ p.prenom }}</td></ng-container>
          <ng-container matColumnDef="telephone"><th mat-header-cell *matHeaderCellDef>Téléphone</th><td mat-cell *matCellDef="let p">{{ p.telephone }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let p">{{ p.email }}</td></ng-container>
          <ng-container matColumnDef="specialite"><th mat-header-cell *matHeaderCellDef>Spécialité</th><td mat-cell *matCellDef="let p">{{ p.specialite }}</td></ng-container>
          <ng-container matColumnDef="tarifJournalier"><th mat-header-cell *matHeaderCellDef>Tarif/Jour</th><td mat-cell *matCellDef="let p">{{ p.tarifJournalier | number:'1.0-0' }} DH</td></ng-container>
          <ng-container matColumnDef="actif"><th mat-header-cell *matHeaderCellDef>Statut</th><td mat-cell *matCellDef="let p"><mat-chip [class]="p.actif ? 'active-chip' : 'inactive-chip'">{{ p.actif ? 'Actif' : 'Inactif' }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let p"><button mat-icon-button><mat-icon>edit</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`.page-container { padding: 0; }.page-card { padding: 20px; border-radius: 12px; }.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }.card-header h2 { margin: 0; color: #1a237e; }.full-width { width: 100%; }.active-chip { background: #e8f5e9 !important; color: #2e7d32 !important; }.inactive-chip { background: #ffebee !important; color: #c62828 !important; }`]
})
export class PrestatairesComponent implements OnInit {
  prestataires = signal<Prestataire[]>([]);
  displayedColumns = ['typePrestataire', 'nom', 'telephone', 'email', 'specialite', 'tarifJournalier', 'actif', 'actions'];
  ngOnInit() {
    this.prestataires.set([
      { id: 1, typePrestataire: 'AVOCAT', nom: 'Kharroubi', prenom: 'Mehdi', telephone: '0661234567', email: 'kharroubi@avocat.ma', adresse: 'Casablanca', specialite: 'Droit bancaire', tarifJournalier: 2500, actif: true },
      { id: 2, typePrestataire: 'HUISSIER', nom: 'Bensaid', prenom: 'Youssef', telephone: '0662345678', email: 'bensaid@huissier.ma', adresse: 'Rabat', specialite: 'Execution', tarifJournalier: 1500, actif: true },
      { id: 3, typePrestataire: 'EXPERT', nom: 'Amrani', prenom: 'Karim', telephone: '0663456789', email: 'amrani@expert.ma', adresse: 'Casablanca', specialite: 'Expertise comptable', tarifJournalier: 2000, actif: true }
    ]);
  }
}

