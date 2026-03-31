import { Injectable, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { Prestataire, TypePrestataire, TYPE_PRESTATAIRE_LABELS, PRESTATAIRE_SPECIALITES } from '../models/prestataire.model';

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

  constructor(private api: ApiService) {
    this.getAll().subscribe();
  }

  getAll(): Observable<Prestataire[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.get<Prestataire[]>(this.endpoint).pipe(
      tap(data => {
        this.prestatairesSignal.set(data || this.getMockPrestataires());
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error loading prestataires:', error);
        this.errorSignal.set('Erreur lors du chargement des prestataires');
        this.loadingSignal.set(false);
        const mockData = this.getMockPrestataires();
        this.prestatairesSignal.set(mockData);
        return of(mockData);
      })
    );
  }

  getById(id: number): Observable<Prestataire | undefined> {
    return this.api.get<Prestataire>(`${this.endpoint}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading prestataire:', error);
        const found = this.prestatairesSignal().find(p => p.idPrestataire === id);
        return of(found);
      })
    );
  }

  getByType(type: TypePrestataire): Observable<Prestataire[]> {
    this.loadingSignal.set(true);
    return this.api.get<Prestataire[]>(`${this.endpoint}?type=${type}`).pipe(
      tap(data => {
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error(`Error loading ${type.toLowerCase()}:`, error);
        this.loadingSignal.set(false);
        const mockData = this.getMockPrestataires(type);
        return of(mockData);
      })
    );
  }

  getPrestataires(): Observable<Prestataire[]> {
    return this.getAll();
  }

  getHuissiers(): Observable<Prestataire[]> {
    return this.getByType('HUISSIER');
  }

  create(prestataire: Partial<Prestataire>): Observable<Prestataire> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.post<Prestataire>(this.endpoint, prestataire).pipe(
      tap(newPrestataire => {
        this.prestatairesSignal.update(list => [...list, newPrestataire]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error creating prestataire:', error);
        this.errorSignal.set('Erreur lors de la création du prestataire');
        this.loadingSignal.set(false);
        const mockPrestataire: Prestataire = {
          ...prestataire,
          id: Date.now(),
          actif: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Prestataire;
        this.prestatairesSignal.update(list => [...list, mockPrestataire]);
        return of(mockPrestataire);
      })
    );
  }

  update(id: number, prestataire: Partial<Prestataire>): Observable<Prestataire> {
    
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.put<Prestataire>(`${this.endpoint}/${id}`, prestataire).pipe(
      tap(updated => {
        this.prestatairesSignal.update(list => 
          list.map(p => p.idPrestataire === id ? updated : p)
        );
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error updating prestataire:', error);
        this.errorSignal.set('Erreur lors de la mise à jour du prestataire');
        this.loadingSignal.set(false);
        const mockUpdated: Prestataire = { ...prestataire, id } as Prestataire;
        this.prestatairesSignal.update(list => 
          list.map(p => p.idPrestataire === id ? mockUpdated : p)
        );
        return of(mockUpdated);
      })
    );
  }

  updateStatus(id: number, actif: boolean): Observable<Prestataire> {
    return this.update(id, { actif });
  }

  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.api.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.prestatairesSignal.update(list => list.filter(p => p.idPrestataire !== id));
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        console.error('Error deleting prestataire:', error);
        this.errorSignal.set('Erreur lors de la suppression du prestataire');
        this.loadingSignal.set(false);
        this.prestatairesSignal.update(list => list.filter(p => p.idPrestataire !== id));
        return of(undefined as any);
      })
    );
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private getMockPrestataires(type?: TypePrestataire): Prestataire[] {
    const allMocks: Prestataire[] = [
      {
        idPrestataire: 1,
        typePrestataire: 'AVOCAT',
        nom: 'Dupont',
        prenom: 'Jean',
        telephone: '+216 98 765 432',
        email: 'jean.dupont@avocat.tn',
        adresse: 'Tunis Centre',
        specialite: 'Droit commercial',
        tarifJournalier: 500,
        actif: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      },
      {
        idPrestataire: 2,
        typePrestataire: 'EXPERT',
        nom: 'Martin',
        prenom: 'Sophie',
        telephone: '+216 97 123 456',
        email: 'sophie.martin@expert.tn',
        adresse: 'Ariana',
        specialite: 'Expertise comptable',
        tarifJournalier: 800,
        actif: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date()
      },
      {
        idPrestataire: 3,
        typePrestataire: 'HUISSIER',
        nom: 'Leroy',
        prenom: 'Pierre',
        telephone: '+216 96 789 012',
        email: 'pierre.leroy@huissier.tn',
        adresse: 'Sfax',
        specialite: 'Significations',
        tarifJournalier: 300,
        actif: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date()
      },
      {
        idPrestataire: 4,
        typePrestataire: 'AVOCAT',
        nom: 'Garcia',
        prenom: 'Maria',
        telephone: '+216 95 456 789',
        email: 'maria.garcia@avocat.tn',
        adresse: 'Sousse',
        specialite: 'Droit du travail',
        tarifJournalier: 450,
        actif: true,
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date()
      }
    ];

    if (type) {
      return allMocks.filter(p => p.typePrestataire === type);
    }
    return allMocks;
  }
}
