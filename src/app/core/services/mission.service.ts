import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import type { Mission, StatutMission } from '../models';



@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private readonly endpoint = '/missions';

  
  private missionsSignal = signal<Mission[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  
  readonly missions = this.missionsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private api: ApiService) {}

  
  getAll(): Observable<Mission[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Mission[]>(this.endpoint).pipe(
      tap(data => {
        this.missionsSignal.set(data || []);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error loading missions:', error);
        this.errorSignal.set('Erreur lors du chargement des missions');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  getByAffaireId(affaireId: number): Observable<Mission[]> {
    return this.api.get<Mission[]>(`${this.endpoint}/affaire/${affaireId}`);
  }

  
  getById(id: number): Observable<Mission | undefined> {
    return this.api.get<Mission>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading mission:', error);
        return throwError(() => error);
      })
    );
  }

  
  create(mission: Partial<Mission>): Observable<Mission> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<Mission>(this.endpoint, mission).pipe(
      tap(newMission => {
        this.missionsSignal.update(list => [...list, newMission]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error creating mission:', error);
        this.errorSignal.set('Erreur lors de la création de la mission');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  
  update(id: number, mission: Partial<Mission>): Observable<Mission> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<Mission>(`${this.endpoint}/${id}`, mission).pipe(
      tap(updated => {
        this.missionsSignal.update(list => 
          list.map(m => m.id === id ? updated : m)
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error updating mission:', error);
        this.errorSignal.set('Erreur lors de la mise à jour de la mission');
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
        this.missionsSignal.update(list => list.filter(m => m.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error deleting mission:', error);
        this.errorSignal.set('Erreur lors de la suppression de la mission');
        this.loadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  
  updateStatus(id: number, statut: StatutMission): Observable<Mission> {
    return this.update(id, { statut });
  }

  validate(id: number): Observable<Mission> {
    return this.api.put<Mission>(`${this.endpoint}/${id}/validate`, {});
  }

  reject(id: number, commentaireRejet?: string): Observable<Mission> {
    return this.api.put<Mission>(`${this.endpoint}/${id}/reject`, { commentaireRejet });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
