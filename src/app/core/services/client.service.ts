import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { environment } from '../../../environments/environment';

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

  private readonly apiUrl = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  // ── GET ALL ──────────────────────────────────────────────────
  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
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
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  // ── CREATE ───────────────────────────────────────────────────
  create(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  // ── UPDATE ───────────────────────────────────────────────────
  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client);
  }

  // ── UPDATE STATUS ────────────────────────────────────────────
  updateStatus(id: number, active: boolean): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}/status`, { active });
  }

  // ── DELETE ───────────────────────────────────────────────────
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
