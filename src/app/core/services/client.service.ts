import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private readonly endpoint = '/clients';

  constructor(private api: ApiService) {}

  getAll(): Observable<Client[]> {
    return this.api.get<Client[]>(this.endpoint);
  }
}

