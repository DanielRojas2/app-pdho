import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { EstablecimientoResponse } from '../../../../core/models/establecimiento.models';

@Component({
  selector: 'app-formulario-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="formulario-page-view">
      <header class="page-header">
        <div>
          <span class="badge-form-type">FORMULARIO 1 OFICIAL</span>
          <h1 class="page-title">Formulario 1: Estadísticas Hoteleras</h1>
          <p class="page-subtitle">
            Declaración jurada mensual de movimiento de huéspedes (llegadas y pernoctaciones) por país de origen.
          </p>
        </div>
      </header>

      @if (establecimiento(); as est) {
        <div class="hero-mini">
          <div>
            <span class="mini-tag">ESTABLECIMIENTO EMISOR</span>
            <strong class="mini-name">{{ est.nombre_establecimiento }}</strong>
            <span class="mini-cat">({{ formatCategoria(est.categoria) }})</span>
          </div>
          <div class="mini-cap tabular-nums">
            Capacidad: {{ est.total_habitaciones }} habitaciones / {{ est.total_plazas }} camas
          </div>
        </div>
      }

      <div class="card form-container-card">
        <div class="card-header">
          <h2 class="card-title">REGISTRO DE DECLARACIÓN JURADA MENSUAL</h2>
          <span class="status-pill">MODO OPERATIVO</span>
        </div>
        <div class="card-body">
          <div class="info-callout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>
              <strong>Módulo de Carga Diaria de Huéspedes Nacionales y Extranjeros</strong>
              <p>
                Permite la digitalización de la boleta de movimiento de pasajeros por día y nacionalidad, con validación de días reales según el mes seleccionado y respaldo fotográfico en PDF.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .formulario-page-view { display: flex; flex-direction: column; gap: 20px; }
    .badge-form-type { font-size: 0.72rem; font-weight: 800; color: #8f1d2c; letter-spacing: 0.05em; }
    .page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 2px 0 0 0; }
    .page-subtitle { font-size: 0.84rem; color: #64748b; margin: 4px 0 0 0; }
    .hero-mini { background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #8f1d2c; border-radius: 6px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .mini-tag { font-size: 0.68rem; font-weight: 700; color: #64748b; display: block; }
    .mini-name { font-size: 0.95rem; color: #0f172a; margin-right: 6px; }
    .mini-cat { font-size: 0.8rem; color: #64748b; }
    .mini-cap { font-size: 0.82rem; font-weight: 600; color: #334155; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .card-header { padding: 14px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .card-title { font-size: 0.82rem; font-weight: 800; color: #1e293b; margin: 0; }
    .status-pill { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
    .card-body { padding: 24px; }
    .info-callout { display: flex; gap: 14px; background: #faf8ff; border: 1px solid #dae2fd; border-radius: 6px; padding: 16px; color: #131b2e; }
    .info-callout svg { width: 22px; height: 22px; color: #8f1d2c; flex-shrink: 0; margin-top: 2px; }
    .info-callout p { margin: 4px 0 0 0; font-size: 0.84rem; color: #584141; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormularioEstadisticasComponent implements OnInit {
  private readonly establecimientoService = inject(EstablecimientoService);
  readonly establecimiento = signal<EstablecimientoResponse | null>(null);

  ngOnInit(): void {
    this.establecimientoService.getMiEstablecimiento().subscribe({
      next: (est) => this.establecimiento.set(est),
      error: (err) => console.error('Error al cargar establecimiento:', err)
    });
  }

  formatCategoria(valor?: string | null): string {
    if (!valor) return '';
    return valor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
