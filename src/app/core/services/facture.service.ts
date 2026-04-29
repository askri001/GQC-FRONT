import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Facture, StatutFacture, TypeFacture } from '../models';

/* ---------------- MOCK DATA ---------------- */

const MOCK_FACTURES: Facture[] = [
  {
    id: 1,
    numero: 'FAC-2024-001',
    dateEmission: new Date('2024-01-15'),
    dateEcheance: new Date('2024-02-15'),
    montant: 15000,
    statut: 'PAYEE',
    typeFacture: 'HONORAIRES',
    dossierId: 1
  },
  {
    id: 2,
    numero: 'FAC-2024-002',
    dateEmission: new Date('2024-02-20'),
    dateEcheance: new Date('2024-03-20'),
    montant: 8500,
    statut: 'EN_ATTENTE',
    typeFacture: 'HONORAIRES',
    dossierId: 2
  },
  {
    id: 3,
    numero: 'FAC-2024-003',
    dateEmission: new Date('2024-03-05'),
    dateEcheance: new Date('2024-04-05'),
    montant: 22000,
    statut: 'EN_RETARD',
    typeFacture: 'FRAIS',
    dossierId: 3
  },
  {
    id: 4,
    numero: 'FAC-2024-004',
    dateEmission: new Date('2024-03-18'),
    dateEcheance: new Date('2024-04-18'),
    montant: 12000,
    statut: 'PAYEE',
    typeFacture: 'HONORAIRES',
    dossierId: 4
  },
  {
    id: 5,
    numero: 'FAC-2024-005',
    dateEmission: new Date('2024-04-01'),
    dateEcheance: new Date('2024-05-01'),
    montant: 5500,
    statut: 'EN_ATTENTE',
    typeFacture: 'FRAIS',
    dossierId: 5
  }
];

/* ---------------- SERVICE ---------------- */

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private readonly endpoint = '/factures';

  private facturesSignal = signal<Facture[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly factures = this.facturesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private api: ApiService) {
    this.getAll().subscribe();
  }

  /* ---------------- GET ALL ---------------- */
  getAll(): Observable<Facture[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Facture[]>(this.endpoint).pipe(
      tap(data => {
        this.facturesSignal.set(data || []);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.warn('API unavailable, using mock factures');
        this.facturesSignal.set(MOCK_FACTURES);
        this.loadingSignal.set(false);
        return of(MOCK_FACTURES);
      })
    );
  }

  /* ---------------- GET BY ID ---------------- */
  getById(id: number): Observable<Facture | undefined> {
    return this.api.get<Facture>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading facture:', error);
        return throwError(() => error);
      })
    );
  }

  /* ---------------- CREATE ---------------- */
  create(facture: Partial<Facture>): Observable<Facture> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<Facture>(this.endpoint, facture).pipe(
      tap(newFacture => {
        this.facturesSignal.update(list => [...list, newFacture]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Erreur lors de la création de la facture');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /* ---------------- UPDATE ---------------- */
  update(id: number, facture: Partial<Facture>): Observable<Facture> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<Facture>(`${this.endpoint}/${id}`, facture).pipe(
      tap(updated => {
        this.facturesSignal.update(list =>
          list.map(f => (f.id === id ? updated : f))
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Erreur lors de la mise à jour de la facture');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /* ---------------- DELETE ---------------- */
  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.facturesSignal.update(list => list.filter(f => f.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.errorSignal.set('Erreur lors de la suppression de la facture');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  /* ---------------- STATUS UPDATE ---------------- */
  updateStatus(id: number, statut: StatutFacture): Observable<Facture> {
    return this.update(id, { statut });
  }

  /* ---------------- CLEAR ERROR ---------------- */
  clearError(): void {
    this.errorSignal.set(null);
  }
}

