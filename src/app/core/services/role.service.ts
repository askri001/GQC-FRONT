import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RoleDTO {
  idRole?: number;
  name: string;
  description?: string;
  permissionIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly endpoint = '/roles';

  constructor(private api: ApiService) {}

  getAll(): Observable<RoleDTO[]> {
    return this.api.get<RoleDTO[]>(this.endpoint);
  }

  getById(id: number): Observable<RoleDTO> {
    return this.api.get<RoleDTO>(`${this.endpoint}/${id}`);
  }

  create(role: Partial<RoleDTO>): Observable<RoleDTO> {
    return this.api.post<RoleDTO>(this.endpoint, role);
  }

  update(id: number, role: Partial<RoleDTO>): Observable<RoleDTO> {
    return this.api.put<RoleDTO>(`${this.endpoint}/${id}`, role);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
