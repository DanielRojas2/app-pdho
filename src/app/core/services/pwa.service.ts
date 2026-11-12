import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly canInstall = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);
  readonly isIos = signal<boolean>(false);
  readonly isAndroid = signal<boolean>(false);
  readonly isMobile = signal<boolean>(false);
  readonly showInstallModal = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      this.initPwa();
    }
  }

  private initPwa(): void {
    // Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIos = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = isIos || isAndroid || window.innerWidth <= 768;

    this.isIos.set(isIos);
    this.isAndroid.set(isAndroid);
    this.isMobile.set(isMobile);

    // Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.isInstalled.set(isStandalone);

    // Listen for install prompt (Chrome, Edge, Samsung Internet, etc.)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.deferredPrompt = null;
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registrado exitosamente:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Error al registrar Service Worker:', err);
          });
      });
    }
  }

  openInstallModal(): void {
    this.showInstallModal.set(true);
  }

  closeInstallModal(): void {
    this.showInstallModal.set(false);
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'manual'> {
    if (this.deferredPrompt) {
      try {
        await this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          this.canInstall.set(false);
          this.isInstalled.set(true);
          this.closeInstallModal();
        }
        this.deferredPrompt = null;
        return choice.outcome;
      } catch (e) {
        console.error('[PWA] Error triggering install prompt:', e);
      }
    }

    // If deferredPrompt is not available (e.g., iOS Safari or already dismissed), open guided modal
    this.openInstallModal();
    return 'manual';
  }
}

