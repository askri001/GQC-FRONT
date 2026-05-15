import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private api = inject(ApiService);
  private readonly endpoint = '/messages';

  unreadCount = signal(0);

  loadUnreadCount(): void {
    this.api.get<number>(`${this.endpoint}/unread-count`).subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {}
    });
  }

  getInbox(): Observable<Message[]> {
    return this.api.get<Message[]>(`${this.endpoint}/inbox`);
  }

  getSent(): Observable<Message[]> {
    return this.api.get<Message[]>(`${this.endpoint}/sent`);
  }

  send(message: Partial<Message>): Observable<Message> {
    return this.api.post<Message>(this.endpoint, message).pipe(
      tap(() => this.loadUnreadCount())
    );
  }

  markAsRead(id: number): Observable<Message> {
    return this.api.put<Message>(`${this.endpoint}/${id}/read`, {}).pipe(
      tap(() => this.loadUnreadCount())
    );
  }

  getAll(): Observable<Message[]> {
    return this.api.get<Message[]>(this.endpoint);
  }
}
