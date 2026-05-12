import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Facture, StatutFacture, TypeFacture } from '../models';

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

  constructor(private api: ApiService) {}

  
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
        return throwError(() => error);
      })
    );
  }

  
  getById(id: number): Observable<Facture | undefined> {
    return this.api.get<Facture>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading facture:', error);
        return throwError(() => error);
      })
    );
  }

  
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
        return throwError(() => error);
      })
    );
  }

  
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
        return throwError(() => error);
      })
    );
  }

  
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
        return throwError(() => error);
      })
    );
  }

  
  updateStatus(id: number, statut: StatutFacture): Observable<Facture> {
    return this.update(id, { statut });
  }

  validate(id: number): Observable<Facture> {
    return this.api.put<Facture>(`${this.endpoint}/${id}/validate`, {});
  }

  reject(id: number, commentaireRejet?: string): Observable<Facture> {
    return this.api.put<Facture>(`${this.endpoint}/${id}/reject`, { commentaireRejet });
  }

  
  clearError(): void {
    this.errorSignal.set(null);
  }
}

