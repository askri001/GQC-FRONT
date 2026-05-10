import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Risque } from '../models';

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

  getByDossierId(dossierId: number): Observable<Risque[]> {
    return this.api.get<Risque[]>(`${this.endpoint}/dossier/${dossierId}`);
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
