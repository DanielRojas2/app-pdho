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
    // 1. Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIos = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isMobile = isIos || isAndroid || window.innerWidth <= 768;

    this.isIos.set(isIos);
    this.isAndroid.set(isAndroid);
    this.isMobile.set(isMobile);

    // 2. Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.isInstalled.set(isStandalone);

    // 3. Check if window.__pwaInstallPrompt was already captured before Angular bootstrapped
    const prePrompt = (window as any).__pwaInstallPrompt as BeforeInstallPromptEvent | undefined;
    if (prePrompt) {
      this.deferredPrompt = prePrompt;
      this.canInstall.set(true);
    }

    // 4. Listen for early event dispatch
    window.addEventListener('pwa-prompt-available', (e: Event) => {
      const customEvent = e as CustomEvent<BeforeInstallPromptEvent>;
      if (customEvent.detail) {
        this.deferredPrompt = customEvent.detail;
      } else if ((window as any).__pwaInstallPrompt) {
        this.deferredPrompt = (window as any).__pwaInstallPrompt;
      }
      this.canInstall.set(true);
    });

    // 5. Normal beforeinstallprompt listener (in case it fires later)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      (window as any).__pwaInstallPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.deferredPrompt = null;
      (window as any).__pwaInstallPrompt = null;
    });

    // 6. Register Service Worker
    if ('serviceWorker' in navigator) {
      // Register after page is loaded to not delay TTI
      if (document.readyState === 'complete') {
        this.registerSw();
      } else {
        window.addEventListener('load', () => this.registerSw());
      }
    }
  }

  private registerSw(): void {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker registrado exitosamente con scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Error al registrar Service Worker:', err);
      });
  }

  openInstallModal(): void {
    this.showInstallModal.set(true);
  }

  closeInstallModal(): void {
    this.showInstallModal.set(false);
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'manual'> {
    // Check if prompt is in this.deferredPrompt or on window
    const promptEvent = this.deferredPrompt || (window as any).__pwaInstallPrompt;

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          this.canInstall.set(false);
          this.isInstalled.set(true);
          this.closeInstallModal();
        }
        this.deferredPrompt = null;
        (window as any).__pwaInstallPrompt = null;
        return choice.outcome;
      } catch (e) {
        console.error('[PWA] Error al disparar el diálogo nativo de instalación:', e);
      }
    }

    // Si no está disponible el evento nativo (ej. iOS Safari o navegador ya bloqueó el prompt), abrir modal guiado paso a paso
    this.openInstallModal();
    return 'manual';
  }
}
