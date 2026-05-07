import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-avocats',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div style="padding:32px;text-align:center;color:#555">
      <p>Les avocats sont gérés dans le module
        <a routerLink="/prestataires" style="color:#00966E;font-weight:600">Prestataires</a>
        (onglet Avocats).
      </p>
    </div>
  `
})
export class AvocatsComponent {}
