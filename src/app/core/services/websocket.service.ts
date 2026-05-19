import { Injectable, inject, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private client: Client | null = null;
  private connected = false;

  // Subjects that components can subscribe to
  newMessage$       = new Subject<Message>();
  notifRefresh$     = new Subject<void>();

  connect(token: string, username: string): void {
    if (this.connected) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;

        // Subscribe to personal message queue
        this.client!.subscribe(`/user/${username}/queue/messages`, (msg: IMessage) => {
          try {
            const message: Message = JSON.parse(msg.body);
            this.newMessage$.next(message);
            this.notifRefresh$.next();
          } catch {}
        });

        // Subscribe to personal notification queue
        this.client!.subscribe(`/user/${username}/queue/notifications`, () => {
          this.notifRefresh$.next();
        });
      },
      onDisconnect: () => {
        this.connected = false;
      },
      onStompError: () => {
        this.connected = false;
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
