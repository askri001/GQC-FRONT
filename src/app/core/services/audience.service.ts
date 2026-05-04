import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Audience } from '../models/audience.model';

@Injectable({
  providedIn: 'root'
})
export class AudienceService {
  private readonly endpoint = '/audiences';

  constructor(private api: ApiService) {}

  getAll(): Observable<Audience[]> {
    return this.api.get<Audience[]>(this.endpoint);
  }

  getById(id: number): Observable<Audience> {
    return this.api.get<Audience>(`${this.endpoint}/${id}`);
  }

  create(audience: Partial<Audience>): Observable<Audience> {
    return this.api.post<Audience>(this.endpoint, audience);
  }

  update(id: number, audience: Partial<Audience>): Observable<Audience> {
    return this.api.put<Audience>(`${this.endpoint}/${id}`, audience);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
