import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { EstablecimientoResponse } from '../../../../core/models/establecimiento.models';

@Component({
  selector: 'app-mis-formularios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mis-formularios-view">
      <header class="view-header">
        <div>
          <h1 class="page-title">Historial de Formularios y Boletas Oficiales</h1>
          <p class="page-subtitle">
            Registro de declaraciones juradas mensuales enviadas al Sistema SIREH y Gobernanza Departamental de Oruro.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="../formulario-1" class="btn-action btn-outline">
            Llenar Formulario 1: Estadísticas
          </a>
          <a routerLink="../formulario-2" class="btn-action btn-primary">
            Llenar Formulario 2: Ocupación
          </a>
        </div>
      </header>

      @if (establecimiento(); as est) {
        <div class="establishment-summary-card">
          <div class="summary-left">
            <div class="status-row">
              <span class="est-tag">ESTABLECIMIENTO EMISOR</span>
              <span class="status-chip chip-activo">
                <span class="chip-dot"></span>
                <span>{{ est.activo ? 'ACTIVO / CONFORME' : 'INACTIVO' }}</span>
              </span>
            </div>
            <h2 class="est-name">{{ est.nombre_establecimiento }}</h2>
            <p class="est-address">{{ est.direccion }}</p>
          </div>

          <div class="summary-right">
            <div class="tile">
              <span class="tile-lbl">CATEGORÍA</span>
              <strong class="tile-val">{{ formatCategoria(est.categoria) }}</strong>
            </div>
            <div class="tile">
              <span class="tile-lbl">CAPACIDAD TOTAL</span>
              <strong class="tile-val tabular-nums">{{ est.total_habitaciones }} hab / {{ est.total_plazas }} camas</strong>
            </div>
            <div class="tile">
              <span class="tile-lbl">LOCALIDAD</span>
              <strong class="tile-val">Oruro, Bolivia</strong>
            </div>
          </div>
        </div>
      }

      <section class="card table-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">DECLARACIONES MENSUALES PRESENTADAS</h2>
            <p class="card-sub">Regla legal: Presentación antes del día 6 del mes siguiente</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PERÍODO</th>
                <th>TIPO FORMULARIO</th>
                <th>FECHA DE PRESENTACIÓN</th>
                <th>ESTADO LEGAL</th>
                <th>RESPONSABLE</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="6" class="empty-cell">
                  <div class="empty-state-simple">
                    <p class="empty-text">No hay declaraciones juradas presentadas aún para la gestión actual.</p>
                    <p class="empty-subtext">Utilice los botones superiores para enviar las declaraciones del mes activo.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .mis-formularios-view { display: flex; flex-direction: column; gap: 20px; }
    .view-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0; }
    .page-subtitle { font-size: 0.84rem; color: #64748b; margin: 4px 0 0 0; }
    .header-actions { display: flex; gap: 10px; }
    .btn-action { display: inline-flex; align-items: center; padding: 0 16px; height: 38px; border-radius: 4px; font-size: 0.82rem; font-weight: 700; text-decoration: none; transition: all 0.15s ease; }
    .btn-outline { background: #ffffff; border: 1px solid #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f8fafc; color: #0f172a; }
    .btn-primary { background: #8f1d2c; color: #ffffff; border: none; box-shadow: 0 2px 4px rgba(143, 29, 44, 0.2); }
    .btn-primary:hover { background: #7a1521; }
    .establishment-summary-card { background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #8f1d2c; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
    .est-tag { font-size: 0.72rem; font-weight: 800; color: #8f1d2c; letter-spacing: 0.05em; text-transform: uppercase; }
    .status-row { display: flex; align-items: center; gap: 10px; }
    .status-chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
    .chip-activo { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; }
    .est-name { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0; }
    .est-address { font-size: 0.85rem; color: #64748b; margin: 0; }
    .summary-right { display: flex; gap: 12px; flex-wrap: wrap; }
    .tile { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; min-width: 130px; display: flex; flex-direction: column; gap: 2px; }
    .tile-lbl { font-size: 0.68rem; font-weight: 700; color: #64748b; }
    .tile-val { font-size: 0.88rem; font-weight: 800; color: #0f172a; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background: #ffffff; }
    .card-title { font-size: 0.82rem; font-weight: 800; color: #1e293b; letter-spacing: 0.05em; margin: 0; }
    .card-sub { font-size: 0.75rem; color: #64748b; margin: 2px 0 0 0; }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; }
    .data-table th { background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.72rem; letter-spacing: 0.05em; padding: 10px 16px; border-bottom: 2px solid #cbd5e1; white-space: nowrap; }
    .data-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .empty-cell { padding: 48px 20px !important; text-align: center; }
    .empty-state-simple { display: flex; flex-direction: column; gap: 4px; }
    .empty-text { font-size: 0.9rem; font-weight: 600; color: #475569; margin: 0; }
    .empty-subtext { font-size: 0.8rem; color: #94a3b8; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisFormulariosComponent implements OnInit {
  private readonly establecimientoService = inject(EstablecimientoService);
  readonly establecimiento = signal<EstablecimientoResponse | null>(null);

  ngOnInit(): void {
    this.establecimientoService.getMiEstablecimiento().subscribe({
      next: (est) => this.establecimiento.set(est),
      error: (err) => console.error('Error al cargar establecimiento en mis formularios:', err)
    });
  }

  formatCategoria(valor?: string | null): string {
    if (!valor) return 'Sin categoría';
    return valor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
