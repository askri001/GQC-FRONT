import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Affaire } from '../models/affaire.model';

@Injectable({
  providedIn: 'root'
})
export class AffaireService {
  private readonly endpoint = '/affaires';

  constructor(private api: ApiService) {}

  getAll(): Observable<Affaire[]> {
    return this.api.get<Affaire[]>(this.endpoint);
  }

  getByDossierId(dossierId: number): Observable<Affaire[]> {
    return this.api.get<Affaire[]>(`${this.endpoint}/dossier/${dossierId}`);
  }

  getById(id: number): Observable<Affaire> {
    return this.api.get<Affaire>(`${this.endpoint}/${id}`);
  }

  create(affaire: Partial<Affaire>): Observable<Affaire> {
    return this.api.post<Affaire>(this.endpoint, affaire);
  }

  update(id: number, affaire: Partial<Affaire>): Observable<Affaire> {
    return this.api.put<Affaire>(`${this.endpoint}/${id}`, affaire);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  validate(id: number): Observable<Affaire> {
    return this.api.put<Affaire>(`${this.endpoint}/${id}/validate`, {});
  }

  reject(id: number, commentaireRejet?: string): Observable<Affaire> {
    return this.api.put<Affaire>(`${this.endpoint}/${id}/reject`, { commentaireRejet });
  }
}
