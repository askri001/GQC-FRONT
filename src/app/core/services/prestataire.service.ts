import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Prestataire, TypePrestataire } from '../models/prestataire.model';

@Injectable({
  providedIn: 'root'
})
export class PrestataireService {

  private readonly endpoint = '/prestataires';

  private prestatairesSignal = signal<Prestataire[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly prestataires = this.prestatairesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private api: ApiService) {}

  
  getAll(): Observable<Prestataire[]> {

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Prestataire[]>(this.endpoint).pipe(

      tap(data => {
        this.prestatairesSignal.set(data);
        this.loadingSignal.set(false);
      }),

      catchError(error => {
        console.error('Erreur chargement prestataires', error);
        this.loadingSignal.set(false);
        this.errorSignal.set('Erreur lors du chargement');
        return of([]);
      })

    );
  }

  
  getById(id: number): Observable<Prestataire> {

    return this.api.get<Prestataire>(`${this.endpoint}/${id}`).pipe(

      catchError(error => {
        console.error('Erreur chargement prestataire', error);
        return of({} as Prestataire);
      })

    );
  }

  
  getByType(type: TypePrestataire): Observable<Prestataire[]> {

    this.loadingSignal.set(true);

    return this.api.get<Prestataire[]>(`${this.endpoint}/type/${type}`).pipe(

      tap(() => {
        this.loadingSignal.set(false);
      }),

      catchError(error => {
        console.error('Erreur chargement type', error);
        this.loadingSignal.set(false);
        return of([]);
      })

    );
  }

  
  create(prestataire: Prestataire): Observable<Prestataire> {

    this.loadingSignal.set(true);

    return this.api.post<Prestataire>(this.endpoint, prestataire).pipe(

      tap(newPrestataire => {

        this.prestatairesSignal.update(list => [...list, newPrestataire]);

        this.loadingSignal.set(false);
      }),

      catchError(error => {

        console.error('Erreur création prestataire', error);

        this.loadingSignal.set(false);

        this.errorSignal.set('Erreur lors de la création');

        return of({} as Prestataire);
      })

    );
  }

  
  update(id: number, prestataire: Prestataire): Observable<Prestataire> {

    this.loadingSignal.set(true);

    return this.api.put<Prestataire>(`${this.endpoint}/${id}`, prestataire).pipe(

      tap(updated => {

        this.prestatairesSignal.update(list =>
          list.map(p => p.idPrestataire === id ? updated : p)
        );

        this.loadingSignal.set(false);

      }),

      catchError(error => {

        console.error('Erreur update prestataire', error);

        this.loadingSignal.set(false);

        this.errorSignal.set('Erreur lors de la modification');

        return of({} as Prestataire);
      })

    );
  }

  
  updateStatus(id: number, actif: boolean): Observable<Prestataire> {

    return this.update(id, { actif } as Prestataire);

  }

  
  delete(id: number): Observable<void> {

    this.loadingSignal.set(true);

    return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(

      tap(() => {

        this.prestatairesSignal.update(list =>
          list.filter(p => p.idPrestataire !== id)
        );

        this.loadingSignal.set(false);

      }),

      catchError(error => {

        console.error('Erreur suppression prestataire', error);

        this.loadingSignal.set(false);

        this.errorSignal.set('Erreur suppression');

        return of(undefined as any);

      })

    );
  }

  clearError(): void {

    this.errorSignal.set(null);

  }

}
