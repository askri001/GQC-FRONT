import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-avocats',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
  template: `
    <div class="page-container">
      <mat-card>
        <div class="card-header">
          <h2>Avocats</h2>
          <a routerLink="/prestataires" mat-button>Retour Prestataires</a>
        </div>
        <p>Liste dédiée avocats (redirection vers prestataires pour gestion).</p>
      </mat-card>
    </div>
  `,
  styleUrls: ['./avocats.css']
})
export class AvocatsComponent { }
