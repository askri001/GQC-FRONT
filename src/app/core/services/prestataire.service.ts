import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';
import { Prestataire, TypePrestataire } from '../models/prestataire.model';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

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

      map(data => (data ?? []).map(p => ({
        ...p,
        idPrestataire: p.idPrestataire ?? (p as any).id,
        typePrestataire: (p.typePrestataire ?? (p as any).type) as TypePrestataire,
      }))),

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

  
  getPaginated(
    page: number,
    size: number,
    search?: string,
    type?: TypePrestataire,
    actif?: boolean
  ): Observable<PageResponse<Prestataire>> {
    // Backend has no /paginated endpoint — use /type/{type} or /getAll, filter client-side
    const source$ = type
      ? this.api.get<Prestataire[]>(`${this.endpoint}/type/${type}`)
      : this.api.get<Prestataire[]>(this.endpoint);

    return source$.pipe(
      map(all => {
        let filtered = (all ?? []).map(p => ({
          ...p,
          // normalise: backend returns "id" and "type", map to Angular field names
          idPrestataire: p.idPrestataire ?? (p as any).id,
          typePrestataire: (p.typePrestataire ?? (p as any).type) as TypePrestataire,
        }));

        if (search?.trim()) {
          const s = search.trim().toLowerCase();
          filtered = filtered.filter(p =>
            p.nom?.toLowerCase().includes(s) ||
            p.email?.toLowerCase().includes(s) ||
            p.specialite?.toLowerCase().includes(s)
          );
        }

        if (actif !== undefined) {
          filtered = filtered.filter(p => p.actif === actif);
        }

        const start = page * size;
        return {
          content: filtered.slice(start, start + size),
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size),
          size,
          number: page,
        };
      }),
      catchError(error => {
        console.error('Erreur chargement paginé prestataires', error);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page });
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

  
  create(prestataire: Partial<Prestataire>): Observable<Prestataire> {

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

        throw error;
      })

    );
  }

  
  update(id: number, prestataire: Partial<Prestataire>): Observable<Prestataire> {

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

        throw error;
      })

    );
  }

  
  updateStatus(id: number, actif: boolean): Observable<Prestataire> {
    // Backend uses @RequestParam actif — pass it in the URL, body is empty
    return this.api.put<Prestataire>(`${this.endpoint}/${id}/status?actif=${actif}`, {}).pipe(

      tap(updated => {
        this.prestatairesSignal.update(list =>
          list.map(p => p.idPrestataire === id ? updated : p)
        );
      }),

      catchError(error => {
        console.error('Erreur changement statut prestataire', error);
        this.errorSignal.set('Erreur lors du changement de statut');
        throw error;
      })

    );
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
        // Do NOT swallow — rethrow so the component's error() handler fires
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  clearError(): void {

    this.errorSignal.set(null);

  }

}
