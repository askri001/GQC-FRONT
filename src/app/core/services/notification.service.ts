import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Dossier } from '../models/dossier.model';
import { Affaire } from '../models/affaire.model';
import { Mission } from '../models/mission.model';
import { Facture } from '../models/facture.model';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  icon: string;
  title: string;
  message: string;
  route: string;
  entityId?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api         = inject(ApiService);
  private authService = inject(AuthService);

  notifications = signal<Notification[]>([]);
  loading       = signal(false);

  load(): void {
    this.loading.set(true);

    forkJoin({
      dossiers: this.api.get<Dossier[]>('/dossiers'),
      affaires: this.api.get<Affaire[]>('/affaires'),
      missions: this.api.get<Mission[]>('/missions'),
      factures: this.api.get<Facture[]>('/factures'),
    }).subscribe({
      next: ({ dossiers, affaires, missions, factures }) => {
        const items: Notification[] = [];
        const isCD   = this.authService.hasRole('ROLE_CHARGEDOSSIER');
        const isResp = this.authService.hasRole('ROLE_RESPONSABLE');
        const isAdmin = this.authService.isAdmin();

        // ── RESPONSABLE & ADMIN: items waiting for validation ──
        if (isResp || isAdmin) {
          (dossiers || []).filter(d => d.statut === 'EN_ATTENTE_VALIDATION').forEach(d => {
            items.push({ id: `dos-val-${d.idDossier}`, type: 'warning', icon: 'folder',
              title: 'Dossier à valider', message: d.reference,
              route: '/dossiers', entityId: d.idDossier });
          });
          (dossiers || []).filter(d => d.statut === 'EN_ATTENTE_CLOTURE').forEach(d => {
            items.push({ id: `dos-clo-${d.idDossier}`, type: 'warning', icon: 'lock_clock',
              title: 'Clôture à valider', message: d.reference,
              route: '/dossiers', entityId: d.idDossier });
          });
          (affaires || []).filter(a => a.statut === 'EN_ATTENTE_VALIDATION').forEach(a => {
            items.push({ id: `aff-val-${a.idAffaire}`, type: 'warning', icon: 'gavel',
              title: 'Affaire à valider', message: a.numeroProcedure,
              route: '/affaires', entityId: a.idAffaire });
          });
          (missions || []).filter(m => m.statut === 'EN_ATTENTE_VALIDATION').forEach(m => {
            items.push({ id: `mis-val-${m.id}`, type: 'warning', icon: 'assignment',
              title: 'Mission à valider', message: `Mission #${m.id}`,
              route: '/missions', entityId: m.id });
          });
          (factures || []).filter(f => f.statut === 'EN_ATTENTE_VALIDATION').forEach(f => {
            items.push({ id: `fac-val-${f.id}`, type: 'warning', icon: 'receipt',
              title: 'Facture à valider', message: f.numero,
              route: '/factures', entityId: f.id });
          });
        }

        // ── CHARGEDOSSIER & ADMIN: rejected items (check inbox for reason) ──
        if (isCD || isAdmin) {
          (dossiers || []).filter(d => d.statut === 'EN_COURS' && d.commentaireRejet).forEach(d => {
            items.push({ id: `dos-rej-${d.idDossier}`, type: 'warning', icon: 'folder_off',
              title: 'Dossier rejeté — voir messages', message: d.reference,
              route: '/dossiers', entityId: d.idDossier });
          });
          (affaires || []).filter(a => a.statut === 'EN_COURS' && a.commentaireRejet).forEach(a => {
            items.push({ id: `aff-rej-${a.idAffaire}`, type: 'warning', icon: 'gavel',
              title: 'Affaire rejetée — voir messages', message: a.numeroProcedure,
              route: '/affaires', entityId: a.idAffaire });
          });
          (missions || []).filter(m => m.statut === 'EN_COURS' && m.commentaireRejet).forEach(m => {
            items.push({ id: `mis-rej-${m.id}`, type: 'warning', icon: 'assignment_late',
              title: 'Mission rejetée — voir messages', message: `Mission #${m.id}`,
              route: '/missions', entityId: m.id });
          });
          (factures || []).filter(f => f.statut === 'REJETEE' && f.commentaireRejet).forEach(f => {
            items.push({ id: `fac-rej-${f.id}`, type: 'warning', icon: 'receipt_long',
              title: 'Facture rejetée — voir messages', message: f.numero,
              route: '/factures', entityId: f.id });
          });
        }

        this.notifications.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get count(): number {
    return this.notifications().length;
  }
}
