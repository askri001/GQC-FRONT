import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MessageService } from '../../core/services/message.service';
import { Message } from '../../core/models/message.model';
import { ComposeMessageDialogComponent } from '../../shared/compose-message-dialog/compose-message-dialog.component';
import { ViewMessageDialogComponent } from '../../shared/view-message-dialog/view-message-dialog.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, MatDividerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-card">

        <!-- Header -->
        <div class="msg-page-header">
          <div class="header-title">
            <mat-icon class="title-icon">mail</mat-icon>
            <h2>Messagerie</h2>
          </div>
          <button mat-raised-button color="primary" (click)="openCompose()">
            <mat-icon>edit</mat-icon>
            Nouveau message
          </button>
        </div>

        <!-- Tabs -->
        <div class="msg-tabs">
          <button class="msg-tab" [class.active]="activeTab === 'inbox'" (click)="switchTab('inbox')">
            <mat-icon>inbox</mat-icon>
            Reçus
            @if (unreadCount() > 0) {
              <span class="unread-badge">{{ unreadCount() }}</span>
            }
          </button>
          <button class="msg-tab" [class.active]="activeTab === 'sent'" (click)="switchTab('sent')">
            <mat-icon>send</mat-icon>
            Envoyés
          </button>
        </div>

        <mat-divider></mat-divider>

        <!-- Loading -->
        @if (loading()) {
          <div class="msg-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Chargement...</p>
          </div>
        }

        <!-- Empty -->
        @else if (messages().length === 0) {
          <div class="msg-state">
            <mat-icon>{{ activeTab === 'inbox' ? 'inbox' : 'send' }}</mat-icon>
            <p>{{ activeTab === 'inbox' ? 'Aucun message reçu' : 'Aucun message envoyé' }}</p>
          </div>
        }

        <!-- Message list -->
        @else {
          <div class="msg-list">
            @for (m of messages(); track m.id) {
              <div class="msg-row" [class.unread]="activeTab === 'inbox' && !m.read"
                (click)="openMessage(m)">
                <div class="msg-avatar">
                  <mat-icon>{{ activeTab === 'inbox' ? 'person' : 'person_outline' }}</mat-icon>
                </div>
                <div class="msg-info">
                  <div class="msg-row-top">
                    <span class="msg-from">
                      {{ activeTab === 'inbox' ? m.fromUsername : m.toUsername }}
                    </span>
                    <span class="msg-date">{{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="msg-subject">{{ m.subject }}</div>
                  <div class="msg-preview">{{ m.body }}</div>
                  @if (m.entityType) {
                    <span class="msg-entity-tag">
                      <mat-icon style="font-size:12px;width:12px;height:12px">link</mat-icon>
                      {{ m.entityType }} #{{ m.entityId }}
                    </span>
                  }
                </div>
                @if (activeTab === 'inbox' && !m.read) {
                  <div class="unread-dot"></div>
                }
              </div>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      padding: 32px 28px;
      background: #eef4f1;
    }
    .page-card {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 20px rgba(0,100,70,.09);
      padding: 36px 40px 32px;
      max-width: 900px;
      margin: 0 auto;
    }
    .msg-page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-icon {
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
      color: #00966E !important;
    }
    .header-title h2 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      color: #1a2e28;
    }
    .msg-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 0;
    }
    .msg-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border: none;
      background: transparent;
      color: #7aada0;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all .15s;
    }
    .msg-tab mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
    .msg-tab.active { color: #00966E; border-bottom-color: #00966E; font-weight: 600; }
    .msg-tab:hover { color: #00966E; }
    .unread-badge {
      background: #c62828;
      color: #fff;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 11px;
      font-weight: 700;
    }
    .msg-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 60px 24px;
      color: #7aada0;
    }
    .msg-state mat-icon { font-size: 48px !important; width: 48px !important; height: 48px !important; opacity: .4; }
    .msg-list { margin-top: 8px; }
    .msg-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 12px;
      border-bottom: 1px solid #e8f3ee;
      cursor: pointer;
      transition: background .12s;
      border-radius: 8px;
      position: relative;
    }
    .msg-row:hover { background: #f0faf6; }
    .msg-row.unread { background: #f7fdfb; }
    .msg-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e0f5ee;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #00966E;
    }
    .msg-info { flex: 1; min-width: 0; }
    .msg-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
    .msg-from { font-weight: 600; font-size: 14px; color: #1a2e28; }
    .msg-date { font-size: 12px; color: #7aada0; }
    .msg-subject { font-size: 13px; font-weight: 500; color: #2d4a42; margin-bottom: 3px; }
    .msg-preview { font-size: 12px; color: #7aada0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 600px; }
    .msg-entity-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #e0f5ee;
      color: #00966E;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 4px;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00966E;
      flex-shrink: 0;
      margin-top: 6px;
    }
  `]
})
export class MessagesComponent implements OnInit {
  private messageService = inject(MessageService);
  private dialog         = inject(MatDialog);
  private snackBar       = inject(MatSnackBar);

  messages    = signal<Message[]>([]);
  loading     = signal(false);
  activeTab   = 'inbox';
  unreadCount = signal(0);

  ngOnInit(): void {
    this.loadInbox();
    this.loadUnreadCount();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'inbox') this.loadInbox();
    else this.loadSent();
  }

  loadInbox(): void {
    this.loading.set(true);
    this.messageService.getInbox().subscribe({
      next: (data) => { this.messages.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadSent(): void {
    this.loading.set(true);
    this.messageService.getSent().subscribe({
      next: (data) => { this.messages.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadUnreadCount(): void {
    this.messageService.loadUnreadCount();
    this.unreadCount = this.messageService.unreadCount;
  }

  openMessage(m: Message): void {
    if (this.activeTab === 'inbox' && !m.read && m.id) {
      this.messageService.markAsRead(m.id).subscribe({
        next: () => {
          this.messages.update(list => list.map(msg => msg.id === m.id ? { ...msg, read: true } : msg));
          this.loadUnreadCount();
        }
      });
    }
    this.dialog.open(ViewMessageDialogComponent, {
      width: '560px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: { message: m }
    }).afterClosed().subscribe(replied => {
      if (replied) { this.loadInbox(); this.loadUnreadCount(); }
    });
  }

  openCompose(): void {
    this.dialog.open(ComposeMessageDialogComponent, {
      width: '520px', maxWidth: '95vw', panelClass: 'bna-dialog',
      data: {}
    }).afterClosed().subscribe(sent => {
      if (sent) { this.loadSent(); this.snackBar.open('Message envoyé', 'OK', { duration: 2500 }); }
    });
  }
}
