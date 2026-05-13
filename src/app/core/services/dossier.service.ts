import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dossier } from '../models/dossier.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  private readonly endpoint = '/dossiers';

  constructor(private api: ApiService) {}

  getAll(): Observable<Dossier[]> {
    return this.api.get<Dossier[]>(this.endpoint);
  }

  getById(id: number): Observable<Dossier> {
    return this.api.get<Dossier>(`${this.endpoint}/${id}`);
  }

  validate(id: number): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}/validate`, {});
  }

  reject(id: number, commentaireRejet?: string): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}/reject`, { commentaireRejet });
  }

  requestClosure(id: number): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}/request-closure`, {});
  }

  close(id: number): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}/close`, {});
  }

  create(dossier: Omit<Dossier, 'idDossier'>): Observable<Dossier> {
    return this.api.post<Dossier>(this.endpoint, dossier);
  }

  update(id: number, dossier: Dossier): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}`, dossier);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
