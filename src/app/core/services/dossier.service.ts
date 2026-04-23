import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier } from '../models/dossier.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  private readonly endpoint = '/api/dossiers';

  constructor(private api: ApiService) {}

  getAll(): Observable<Dossier[]> {
    return this.api.get<Dossier[]>(this.endpoint);
  }

  create(dossier: Omit<Dossier, 'id'>): Observable<Dossier> {
    return this.api.post<Dossier>(this.endpoint, dossier);
  }

  update(id: number, dossier: Dossier): Observable<Dossier> {
    return this.api.put<Dossier>(`${this.endpoint}/${id}`, dossier);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
