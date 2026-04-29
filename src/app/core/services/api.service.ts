import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Dossier } from '../models/dossier.model';
import { DashboardStats } from '../models/dashboard.model';

/* ---------------- MOCK DATA ---------------- */

const MOCK_STATS: DashboardStats = {
  totalDossiers: 124,
  dossiersActifs: 78,
  dossiersClotures: 32,
  montantTotalRecupere: 2850000,
  montantTotalImpaye: 1200000,
  tauxRecouvrement: 70.4,
  missionsEnCours: 15,
  missionsTerminees: 42,
  facturesEnAttente: 8,
  facturesPayees: 56,
  prestatairesActifs: 12,
  clientsActifs: 89
};

const MOCK_RECENT_DOSSIERS: Dossier[] = [
  {
    id: 1,
    reference: 'DOS-2024-001',
    dateOuverture: new Date('2024-01-15'),
    statut: 'EN_COURS',
    niveauRisque: 'MOYEN',
    montantInitial: 150000,
    montantRecupere: 75000,
    clientId: 1
  },
  {
    id: 2,
    reference: 'DOS-2024-002',
    dateOuverture: new Date('2024-02-20'),
    statut: 'CLOTURE',
    niveauRisque: 'FAIBLE',
    montantInitial: 85000,
    montantRecupere: 85000,
    clientId: 2
  },
  {
    id: 3,
    reference: 'DOS-2024-003',
    dateOuverture: new Date('2024-03-05'),
    statut: 'EN_COURS',
    niveauRisque: 'ELEVE',
    montantInitial: 320000,
    montantRecupere: 45000,
    clientId: 3
  },
  {
    id: 4,
    reference: 'DOS-2024-004',
    dateOuverture: new Date('2024-03-18'),
    statut: 'SUSPENDU',
    niveauRisque: 'CRITIQUE',
    montantInitial: 500000,
    montantRecupere: 0,
    clientId: 4
  },
  {
    id: 5,
    reference: 'DOS-2024-005',
    dateOuverture: new Date('2024-04-01'),
    statut: 'EN_ATTENTE',
    niveauRisque: 'FAIBLE',
    montantInitial: 45000,
    montantRecupere: 0,
    clientId: 5
  }
];

/* ---------------- SERVICE ---------------- */

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /* ---------------- DASHBOARD (FIXED) ---------------- */

  getDashboardStats(): Observable<DashboardStats> {
    // ❌ no backend call → avoids 404
    return of(MOCK_STATS);
  }

  /* ---------------- RECENT DOSSIERS ---------------- */

  getRecentDossiers(limit: number = 5): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(
      `${this.baseUrl}/dossiers/recent?limit=${limit}`
    ).pipe(
      catchError(() => of(MOCK_RECENT_DOSSIERS.slice(0, limit)))
    );
  }

  /* ---------------- GENERIC API ---------------- */

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T = void>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
