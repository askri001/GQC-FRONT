import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Garantie } from '../models/garantie.model';

@Injectable({
  providedIn: 'root'
})
export class GarantieService {
  private readonly endpoint = '/garanties';

  constructor(private api: ApiService) {}

  getAll(): Observable<Garantie[]> {
    return this.api.get<Garantie[]>(this.endpoint);
  }

  getById(id: number): Observable<Garantie> {
    return this.api.get<Garantie>(`${this.endpoint}/${id}`);
  }

  create(garantie: Partial<Garantie>): Observable<Garantie> {
    return this.api.post<Garantie>(this.endpoint, garantie);
  }

  update(id: number, garantie: Partial<Garantie>): Observable<Garantie> {
    return this.api.put<Garantie>(`${this.endpoint}/${id}`, garantie);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
