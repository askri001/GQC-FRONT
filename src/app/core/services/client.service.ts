import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  private apiUrl = 'http://localhost:8080/api/clients';

  constructor(private http: HttpClient) {}

  // ================= GET PAGINATED + FILTERS =================
  getPaginated(
    page: number,
    size: number,
    search?: string,
    typeClient?: string,
    active?: boolean
  ): Observable<PageResponse<Client>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search && search.trim()) {
      params = params.set('search', search);
    }

    if (typeClient) {
      params = params.set('type', typeClient);
    }

    if (active !== undefined && active !== null) {
      params = params.set('active', active);
    }

    return this.http.get<PageResponse<Client>>(this.apiUrl, { params });
  }

  // ================= CREATE =================
  create(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client);
  }

  // ================= UPDATE =================
  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client);
  }

  // ================= DELETE =================
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
