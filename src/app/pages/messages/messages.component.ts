import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Message } from '../../core/models/message.model';

interface Conversation {
  userId: number;
  username: string;
  displayName: string;
  lastMessage: string;
  lastTime: Date | undefined;
  unreadCount: number;
  messages: Message[];
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  private messageService = inject(MessageService);
  private authService    = inject(AuthService);
  private api            = inject(ApiService);
  private wsService      = inject(WebSocketService);
  private snackBar       = inject(MatSnackBar);
  private router         = inject(Router);

  @ViewChild('chatBody') chatBody!: ElementRef;

  conversations  = signal<Conversation[]>([]);
  activeConv     = signal<Conversation | null>(null);
  allUsers       = signal<any[]>([]);
  loading        = signal(false);
  sending        = signal(false);
  newMessage     = '';
  searchQuery    = '';
  showNewChat    = false;
  private shouldScroll = false;
  private subs: Subscription[] = [];

  get currentUserId(): number {
    return Number(localStorage.getItem('auth_user_id')) || 0;
  }

  get currentUsername(): string {
    return this.authService.currentUser()?.username || '';
  }

  ngOnInit(): void {
    this.loadAll();
    this.api.get<any[]>('/users/for-messaging').subscribe({
      next: (data) => this.allUsers.set((data ?? []).filter(u => u.username !== this.currentUsername)),
      error: () => {}
    });

    // Real-time: when a new message arrives via WebSocket
    this.subs.push(
      this.wsService.newMessage$.subscribe((msg: Message) => {
        // Add message to the correct conversation and reload
        this.loadAll();
        this.shouldScroll = true;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadAll(): void {
    this.loading.set(true);
    // Load both inbox and sent to build conversations
    Promise.all([
      this.messageService.getInbox().toPromise(),
      this.messageService.getSent().toPromise()
    ]).then(([inbox, sent]) => {
      const all = [...(inbox ?? []), ...(sent ?? [])];
      this.buildConversations(all, inbox ?? []);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }

  buildConversations(all: Message[], inbox: Message[]): void {
    const convMap = new Map<number, Conversation>();
    const myId = this.currentUserId;

    all.forEach(msg => {
      // The "other" person in this message
      const otherId   = msg.fromUserId === myId ? msg.toUserId!   : msg.fromUserId!;
      const otherName = msg.fromUserId === myId ? msg.toUsername!  : msg.fromUsername!;
      const otherNom  = msg.fromUserId === myId
        ? ''
        : `${msg.fromPrenom || ''} ${msg.fromNom || ''}`.trim();

      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId: otherId,
          username: otherName,
          displayName: otherNom || otherName,
          lastMessage: '',
          lastTime: undefined,
          unreadCount: 0,
          messages: []
        });
      }

      const conv = convMap.get(otherId)!;
      conv.messages.push(msg);
    });

    // Count unread per conversation
    inbox.forEach(msg => {
      if (!msg.read && msg.fromUserId !== myId) {
        const conv = convMap.get(msg.fromUserId!);
        if (conv) conv.unreadCount++;
      }
    });

    // Sort messages within each conversation by date
    convMap.forEach(conv => {
      conv.messages.sort((a, b) =>
        new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      );
      const last = conv.messages[conv.messages.length - 1];
      if (last) {
        conv.lastMessage = last.body;
        conv.lastTime    = new Date(last.createdAt!);
      }
    });

    // Sort conversations by last message time (newest first)
    const sorted = Array.from(convMap.values()).sort((a, b) => {
      if (!a.lastTime) return 1;
      if (!b.lastTime) return -1;
      return b.lastTime.getTime() - a.lastTime.getTime();
    });

    this.conversations.set(sorted);

    // Restore active conversation if one was open
    const active = this.activeConv();
    if (active) {
      const updated = sorted.find(c => c.userId === active.userId);
      if (updated) this.activeConv.set(updated);
    }
  }

  openConversation(conv: Conversation): void {
    this.activeConv.set(conv);
    this.showNewChat = false;
    this.shouldScroll = true;

    // Mark unread messages as read
    conv.messages
      .filter(m => !m.read && m.fromUserId !== this.currentUserId && m.id)
      .forEach(m => {
        this.messageService.markAsRead(m.id!).subscribe();
      });
    conv.unreadCount = 0;
  }

  startNewChat(user: any): void {
    // Check if conversation already exists
    const existing = this.conversations().find(c => c.userId === user.id);
    if (existing) {
      this.openConversation(existing);
      return;
    }
    // Create a new empty conversation
    const newConv: Conversation = {
      userId: user.id,
      username: user.username,
      displayName: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.username,
      lastMessage: '',
      lastTime: undefined,
      unreadCount: 0,
      messages: []
    };
    this.conversations.update(list => [newConv, ...list]);
    this.activeConv.set(newConv);
    this.showNewChat = false;
  }

  sendMessage(): void {
    const body = this.newMessage.trim();
    const conv = this.activeConv();
    if (!body || !conv || this.sending()) return;

    this.sending.set(true);
    this.messageService.send({
      toUserId: conv.userId,
      subject:  `Message de ${this.currentUsername}`,
      body
    }).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending.set(false);
        this.shouldScroll = true;
        this.loadAll();
      },
      error: () => {
        this.sending.set(false);
        this.snackBar.open('Erreur lors de l\'envoi', 'OK', { duration: 3000 });
      }
    });
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch {}
  }

  isMine(msg: Message): boolean {
    return msg.fromUserId === this.currentUserId;
  }

  getEntityIcon(type: string): string {
    const map: Record<string, string> = {
      DOSSIER: 'folder', AFFAIRE: 'gavel', MISSION: 'assignment', FACTURE: 'receipt'
    };
    return map[type] ?? 'link';
  }

  goToEntity(msg: Message): void {
    const routes: Record<string, string> = {
      DOSSIER: '/dossiers', AFFAIRE: '/affaires', MISSION: '/missions', FACTURE: '/factures'
    };
    const route = routes[msg.entityType ?? ''];
    if (route) this.router.navigate([route]);
  }

  filteredConversations(): Conversation[] {
    if (!this.searchQuery) return this.conversations();
    const q = this.searchQuery.toLowerCase();
    return this.conversations().filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q)
    );
  }

  filteredUsers(): any[] {
    if (!this.searchQuery) return this.allUsers();
    const q = this.searchQuery.toLowerCase();
    return this.allUsers().filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.prenom?.toLowerCase().includes(q)
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  toDate(d: Date | string | undefined): Date | undefined {
    if (!d) return undefined;
    return d instanceof Date ? d : new Date(d);
  }

  formatTime(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString('fr-TN', { weekday: 'short' });
    return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' });
  }
}
