import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { User } from '../models';

export interface CreateUserRequest {
  username: string;
  email: string;
  prenom: string;
  nom: string;
  password: string;
  roleIds: number[];
}

export interface UpdateUserRequest {
  prenom?: string;
  nom?: string;
  email?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private api: ApiService) {}

  getUsers(): Observable<any[]> {
    return this.api.get<any[]>('/users');
  }

  getUser(id: number): Observable<any> {
    return this.api.get<any>(`/users/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<any> {
    return this.api.post('/users', user);
  }

  updateUser(id: number, user: UpdateUserRequest): Observable<any> {
    return this.api.put(`/users/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.api.delete(`/users/${id}`);
  }

  toggleStatus(id: number, currentStatus: boolean): Observable<any> {
    return this.api.put(`/users/${id}/toggle-status`, {});
  }

  assignRole(userId: number, roleId: number): Observable<any> {
    return this.api.put(`/users/${userId}/roles/${roleId}`, {});
  }

  
}
