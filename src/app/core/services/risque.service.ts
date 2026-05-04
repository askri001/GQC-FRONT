import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Risque } from '../models';

const MOCK_RISQUES: Risque[] = [
  { id: 1, montantPrincipal: 150000, montantInteret: 15000, montantTotal: 165000, dateContrat: new Date('2024-01-15'), dateEcheance: new Date('2024-06-15'), tauxInteret: 10, dossierId: 1, actif: true },
  { id: 2, montantPrincipal: 85000, montantInteret: 5000, montantTotal: 90000, dateContrat: new Date('2024-02-20'), dateEcheance: new Date('2024-05-20'), tauxInteret: 6, dossierId: 2, actif: true },
  { id: 3, montantPrincipal: 320000, montantInteret: 48000, montantTotal: 368000, dateContrat: new Date('2024-03-05'), dateEcheance: new Date('2025-03-05'), tauxInteret: 15, dossierId: 3, actif: true },
  { id: 4, montantPrincipal: 500000, montantInteret: 75000, montantTotal: 575000, dateContrat: new Date('2024-03-18'), dateEcheance: new Date('2024-09-18'), tauxInteret: 15, dossierId: 4, actif: false }
];

@Injectable({
  providedIn: 'root'
})
export class RisqueService {
  private readonly endpoint = '/risques';

  
  private risquesSignal = signal<Risque[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  
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
        return throwError(() => error);
      })
    );
  }

  getById(id: number): Observable<Risque | undefined> {
    return this.api.get<Risque>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading risque:', error);
        return throwError(() => error);
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
        return throwError(() => error);
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
        return throwError(() => error);
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
        return throwError(() => error);
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
