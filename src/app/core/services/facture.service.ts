import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Facture, StatutFacture, TypeFacture } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private readonly endpoint = '/factures';

  // Signals for reactive state
  private facturesSignal = signal<Facture[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public signals
  readonly factures = this.facturesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

constructor(private api: ApiService) {
    // Load on init
    this.getAll().subscribe();
  }

  /**
   * Get all invoices
   */
  getAll(): Observable<Facture[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Facture[]>(this.endpoint).pipe(
      tap(data => {
        this.facturesSignal.set(data || []);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error loading factures:', error);
        this.errorSignal.set('Erreur lors du chargement des factures');
        this.loadingSignal.set(false);
        // Return mock data for demo if API fails
        this.facturesSignal.set(this.getMockFactures());
        return of(this.getMockFactures());
      })
    );
  }

  /**
   * Get invoice by ID
   */
  getById(id: number): Observable<Facture | undefined> {
    return this.api.get<Facture>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading facture:', error);
        // Return from local cache
        const found = this.facturesSignal().find(f => f.id === id);
        return of(found);
      })
    );
  }

  /**
   * Create new invoice
   */
  create(facture: Partial<Facture>): Observable<Facture> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<Facture>(this.endpoint, facture).pipe(
      tap(newFacture => {
        this.facturesSignal.update(list => [...list, newFacture]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error creating facture:', error);
        this.errorSignal.set('Erreur lors de la création de la facture');
        this.loadingSignal.set(false);
this.errorSignal.set('Backend non disponible - mode démo actif');
        const mockFacture: Facture = {
          ...facture,
          id: Date.now()
        } as Facture;
        this.facturesSignal.update(list => [...list, mockFacture]);
        return of(mockFacture);
      })
    );
  }

  /**
   * Update existing invoice
   */
  update(id: number, facture: Partial<Facture>): Observable<Facture> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<Facture>(`${this.endpoint}/${id}`, facture).pipe(
      tap(updated => {
        this.facturesSignal.update(list => 
          list.map(f => f.id === id ? updated : f)
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error updating facture:', error);
        this.errorSignal.set('Erreur lors de la mise à jour de la facture');
        this.loadingSignal.set(false);
        // Mock update for demo
        const mockFacture: Facture = { ...facture, id } as Facture;
        this.facturesSignal.update(list => 
          list.map(f => f.id === id ? mockFacture : f)
        );
        return of(mockFacture);
      })
    );
  }

  /**
   * Delete invoice
   */
  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.facturesSignal.update(list => list.filter(f => f.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error deleting facture:', error);
        this.errorSignal.set('Erreur lors de la suppression de la facture');
        this.loadingSignal.set(false);
        // Mock delete for demo
        this.facturesSignal.update(list => list.filter(f => f.id !== id));
        return of(undefined as any);
      })
    );
  }

  /**
   * Update invoice status
   */
  updateStatus(id: number, statut: StatutFacture): Observable<Facture> {
    return this.update(id, { statut });
  }

  /**
   * Get mock data for demo
   */
  private getMockFactures(): Facture[] {
    return [
      { 
        id: 1, 
        numero: 'FAC-2024-001', 
        dateEmission: new Date('2024-01-15'), 
        montant: 2500, 
        typeFacture: 'HONORAIRES', 
        statut: 'PAYEE',
        missionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        numero: 'FAC-2024-002', 
        dateEmission: new Date('2024-02-01'), 
        montant: 1500, 
        typeFacture: 'FRAIS', 
        statut: 'EN_ATTENTE',
        missionId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 3, 
        numero: 'FAC-2024-003', 
        dateEmission: new Date('2024-02-15'), 
        montant: 5000, 
        typeFacture: 'EXPERTISE', 
        statut: 'VALIDEE',
        missionId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 4, 
        numero: 'FAC-2024-004', 
        dateEmission: new Date('2024-03-01'), 
        montant: 800, 
        typeFacture: 'AUTRE', 
        statut: 'REJETEE',
        missionId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}

