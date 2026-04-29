import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Dossier } from '../models/dossier.model';
import { ApiService } from './api.service';

const MOCK_DOSSIERS: Dossier[] = [
  { id: 1, reference: 'DOS-2024-001', dateOuverture: new Date('2024-01-15'), statut: 'EN_COURS', niveauRisque: 'MOYEN', montantInitial: 150000, montantRecupere: 75000, clientId: 1 },
  { id: 2, reference: 'DOS-2024-002', dateOuverture: new Date('2024-02-20'), statut: 'CLOTURE', niveauRisque: 'FAIBLE', montantInitial: 85000, montantRecupere: 85000, clientId: 2 },
  { id: 3, reference: 'DOS-2024-003', dateOuverture: new Date('2024-03-05'), statut: 'EN_COURS', niveauRisque: 'ELEVE', montantInitial: 320000, montantRecupere: 45000, clientId: 3 },
  { id: 4, reference: 'DOS-2024-004', dateOuverture: new Date('2024-03-18'), statut: 'SUSPENDU', niveauRisque: 'CRITIQUE', montantInitial: 500000, montantRecupere: 0, clientId: 4 },
  { id: 5, reference: 'DOS-2024-005', dateOuverture: new Date('2024-04-01'), statut: 'EN_ATTENTE', niveauRisque: 'FAIBLE', montantInitial: 45000, montantRecupere: 0, clientId: 5 }
];

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  private readonly endpoint = '/api/dossiers';

  constructor(private api: ApiService) {}

  getAll(): Observable<Dossier[]> {
    return this.api.get<Dossier[]>(this.endpoint).pipe(
      catchError(() => of(MOCK_DOSSIERS))
    );
  }

  create(dossier: Omit<Dossier, 'id'>): Observable<Dossier> {
    return this.api.post<Dossier>(this.endpoint, dossier);
  }

  update(id: number, dossier: Dossier): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}`, dossier);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
