import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Client } from '../models/client.model';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private readonly endpoint = '/clients';

  constructor(private api: ApiService) {}

  // ── GET ALL ──────────────────────────────────────────────────
  getAll(): Observable<Client[]> {
    return this.api.get<Client[]>(this.endpoint);
  }

  // ── GET PAGINATED (client-side) ──────────────────────────────
  getPaginated(
    page: number,
    size: number,
    search?: string,
    typeClient?: string,
    active?: boolean
  ): Observable<PageResponse<Client>> {
    return new Observable(observer => {
      this.getAll().subscribe({
        next: (all) => {
          let filtered = all;

          if (search?.trim()) {
            const s = search.trim().toLowerCase();
            filtered = filtered.filter(c =>
              c.nom?.toLowerCase().includes(s) ||
              c.email?.toLowerCase().includes(s) ||
              c.tel?.includes(s)
            );
          }
          if (typeClient) {
            filtered = filtered.filter(c => c.typeClient === typeClient);
          }
          if (active !== undefined && active !== null) {
            filtered = filtered.filter(c => c.active === active);
          }

          const start   = page * size;
          const content = filtered.slice(start, start + size);

          observer.next({
            content,
            totalElements: filtered.length,
            totalPages: Math.ceil(filtered.length / size)
          });
          observer.complete();
        },
        error: (e) => observer.error(e)
      });
    });
  }

  // ── GET BY ID ────────────────────────────────────────────────
  getById(id: number): Observable<Client> {
    return this.api.get<Client>(`${this.endpoint}/${id}`);
  }

  // ── CREATE ───────────────────────────────────────────────────
  create(client: Partial<Client>): Observable<Client> {
    return this.api.post<Client>(this.endpoint, client);
  }

  // ── UPDATE ───────────────────────────────────────────────────
  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.api.put<Client>(`${this.endpoint}/${id}`, client);
  }

  // ── UPDATE STATUS ────────────────────────────────────────────
  updateStatus(id: number, active: boolean): Observable<Client> {
    return this.api.put<Client>(`${this.endpoint}/${id}/status`, { active });
  }

  // ── DELETE ───────────────────────────────────────────────────
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
