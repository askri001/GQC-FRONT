import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const IDLE_TIMEOUT_MS  = 1 * 60 * 1000; // 5 minutes
const WARN_TIMEOUT_MS  = 30 * 1000;      // 30 seconds warning before logout

@Injectable({ providedIn: 'root' })
export class IdleService {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private zone        = inject(NgZone);

  private idleTimer:  ReturnType<typeof setTimeout> | null = null;
  private warnTimer:  ReturnType<typeof setTimeout> | null = null;
  private countdown:  ReturnType<typeof setInterval> | null = null;

  // Public state for the warning banner
  showWarning  = false;
  secondsLeft  = 30;

  private readonly EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

  start(): void {
    this.zone.runOutsideAngular(() => {
      this.EVENTS.forEach(e => window.addEventListener(e, this.onActivity, { passive: true }));
    });
    this.resetTimer();
  }

  stop(): void {
    this.EVENTS.forEach(e => window.removeEventListener(e, this.onActivity));
    this.clearTimers();
    this.zone.run(() => { this.showWarning = false; });
  }

  private onActivity = (): void => {
    if (this.showWarning) return; // don't reset during warning
    this.resetTimer();
  };

  private resetTimer(): void {
    this.clearTimers();
    this.idleTimer = setTimeout(() => {
      this.zone.run(() => this.startWarning());
    }, IDLE_TIMEOUT_MS);
  }

  private startWarning(): void {
    this.showWarning = true;
    this.secondsLeft = 30;

    this.countdown = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) {
        this.doLogout();
      }
    }, 1000);

    this.warnTimer = setTimeout(() => {
      this.doLogout();
    }, WARN_TIMEOUT_MS);
  }

  stayLoggedIn(): void {
    this.zone.run(() => {
      this.showWarning = false;
      this.clearTimers();
      this.resetTimer();
    });
  }

  private doLogout(): void {
    this.stop();
    this.zone.run(() => {
      this.authService.logoutWithMessage('Session expirée — vous avez été déconnecté pour inactivité.');
    });
  }

  private clearTimers(): void {
    if (this.idleTimer)  { clearTimeout(this.idleTimer);   this.idleTimer  = null; }
    if (this.warnTimer)  { clearTimeout(this.warnTimer);   this.warnTimer  = null; }
    if (this.countdown)  { clearInterval(this.countdown);  this.countdown  = null; }
  }
}
