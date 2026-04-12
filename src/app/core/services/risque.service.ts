import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Risque } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RisqueService {
  private readonly endpoint = '/risques';

  // Signals for reactive state
  private risquesSignal = signal<Risque[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public signals
  readonly risques = this.risquesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private api: ApiService) {}

  getAll(): Observable<Risque[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Risque[]>(this.endpoint).pipe(
      tap(data => {
        this.risquesSignal.set(data || []);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error loading risques:', error);
        this.errorSignal.set('Erreur lors du chargement des risques');
        this.loadingSignal.set(false);
        this.risquesSignal.set(this.getMockRisques());
        return of(this.getMockRisques());
      })
    );
  }

  getById(id: number): Observable<Risque | undefined> {
    return this.api.get<Risque>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading risque:', error);
        const found = this.risquesSignal().find(r => r.id === id);
        return of(found);
      })
    );
  }

  create(risque: Partial<Risque>): Observable<Risque> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<Risque>(this.endpoint, risque).pipe(
      tap(newRisque => {
        this.risquesSignal.update(list => [...list, newRisque]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error creating risque:', error);
        this.errorSignal.set('Erreur lors de la création du risque');
        this.loadingSignal.set(false);
        const mockRisque: Risque = {
          ...risque as Risque,
          id: Date.now(),
          actif: true
        };
        this.risquesSignal.update(list => [...list, mockRisque]);
        return of(mockRisque);
      })
    );
  }

  update(id: number, risque: Partial<Risque>): Observable<Risque> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<Risque>(`${this.endpoint}/${id}`, risque).pipe(
      tap(updated => {
        this.risquesSignal.update(list => 
          list.map(r => r.id === id ? updated : r)
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error updating risque:', error);
        this.errorSignal.set('Erreur lors de la mise à jour du risque');
        this.loadingSignal.set(false);
        const mockRisque: Risque = { ...risque, id } as Risque;
        this.risquesSignal.update(list => 
          list.map(r => r.id === id ? mockRisque : r)
        );
        return of(mockRisque);
      })
    );
  }

  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.risquesSignal.update(list => list.filter(r => r.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error deleting risque:', error);
        this.errorSignal.set('Erreur lors de la suppression du risque');
        this.loadingSignal.set(false);
        this.risquesSignal.update(list => list.filter(r => r.id !== id));
        return of(undefined as any);
      })
    );
  }

  private getMockRisques(): Risque[] {
    return [
      { 
        id: 1, 
        montantPrincipal: 100000, 
        montantInteret: 15000, 
        montantTotal: 115000, 
        dateContrat: new Date('2023-01-01'), 
        dateEcheance: new Date('2024-12-31'), 
        tauxInteret: 5.5, 
        dossierId: 1,
        actif: true
      },
      { 
        id: 2, 
        montantPrincipal: 250000, 
        montantInteret: 50000, 
        montantTotal: 300000, 
        dateContrat: new Date('2022-06-15'), 
        dateEcheance: new Date('2024-06-15'), 
        tauxInteret: 6, 
        dossierId: 2,
        actif: true
      },
      { 
        id: 3, 
        montantPrincipal: 50000, 
        montantInteret: 7500, 
        montantTotal: 57500, 
        dateContrat: new Date('2023-08-10'), 
        dateEcheance: new Date('2025-08-10'), 
        tauxInteret: 4.5, 
        dossierId: 3,
        actif: true
      },
      { 
        id: 4, 
        montantPrincipal: 180000, 
        montantInteret: 27000, 
        montantTotal: 207000, 
        dateContrat: new Date('2021-11-20'), 
        dateEcheance: new Date('2024-11-20'), 
        tauxInteret: 7, 
        dossierId: 1,
        actif: true
      }
    ];
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}

