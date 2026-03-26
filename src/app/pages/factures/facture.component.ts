import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FactureService } from '../../core/services/facture.service';

@Component({
  selector: 'app-facture',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Factures</h2>

    <form (ngSubmit)="save()">
      <input type="text" placeholder="Numero" [(ngModel)]="facture.numero" name="numero" required>
      <input type="number" placeholder="Montant" [(ngModel)]="facture.montant" name="montant" required>
      <input type="text" placeholder="Statut" [(ngModel)]="facture.statut" name="statut" required>
      <button type="submit">Ajouter</button>
    </form>

    <hr>

    <ul>
      @for (f of factures; track f.id) {
        <li>
          {{f.numero}} - {{f.montant}} TND
          <button (click)="delete(f.id)">Supprimer</button>
        </li>
      }
    </ul>
  `,
  styles: [`
    form { display: flex; flex-direction: column; gap: 10px; max-width: 400px; margin-bottom: 20px; }
    input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    button { padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1565c0; }
    ul { list-style: none; padding: 0; }
    li { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
  `]
})
export class FactureComponent implements OnInit {
  private service = inject(FactureService);

  factures: any[] = [];
  facture: any = {};

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe((data: any) => {
      this.factures = data;
    });
  }

  save() {
    this.service.create(this.facture).subscribe(() => {
      this.load();
      this.facture = {};
    });
  }

  delete(id: number) {
    this.service.delete(id).subscribe(() => {
      this.load();
    });
  }
}

