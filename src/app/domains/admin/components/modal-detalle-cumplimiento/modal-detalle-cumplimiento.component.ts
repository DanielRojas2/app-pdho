import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  output,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportReportesService, HotelCumplimientoExport } from '../../../../core/services/export-reportes.service';

export interface MesDetalleUI {
  mes: string;
  gestion: number;
  presentado: boolean;
  estado: 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO';
  estadoDetalle?: string;
  fechaPresentacion?: string;
  nroFormulario?: string;
  idEstadistica?: number;
  archivoPdf?: string | null;
}

export interface HotelCumplimientoModalUI extends HotelCumplimientoExport {
  id: number;
  nombre: string;
  categoria: string;
  operador: string;
  telefono: string;
  estado: string;
  totalMesesEsperados: number;
  totalMesesPresentados: number;
  fecha?: string;
  nroFormulario?: string;
  mesesPresentados: MesDetalleUI[];
  mesesPendientes: MesDetalleUI[];
  todosLosMeses: MesDetalleUI[];
}

@Component({
  selector: 'app-modal-detalle-cumplimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle-cumplimiento.component.html',
  styleUrl: './modal-detalle-cumplimiento.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDetalleCumplimientoComponent {
  private readonly exportService = inject(ExportReportesService);

  readonly hotel = input.required<HotelCumplimientoModalUI>();
  readonly periodoLabel = input<string>('Período Actual');

  readonly cerrar = output<void>();
  readonly auditarFormulario = output<{ idEstadistica: number; numeroFormulario?: string }>();

  readonly subfiltroMeses = signal<'TODOS' | 'PRESENTADOS' | 'PENDIENTES'>('TODOS');

  readonly porcentajeCumplimiento = computed(() => {
    const h = this.hotel();
    if (!h || h.totalMesesEsperados <= 0) {
      return h?.estado === 'DECLARADO' ? 100 : 0;
    }
    return Math.round((h.totalMesesPresentados / h.totalMesesEsperados) * 100);
  });

  readonly mesesFiltrados = computed(() => {
    const h = this.hotel();
    if (!h) return [];
    const filtro = this.subfiltroMeses();

    const lista = h.todosLosMeses && h.todosLosMeses.length > 0
      ? h.todosLosMeses
      : [...h.mesesPresentados, ...h.mesesPendientes];

    if (filtro === 'PRESENTADOS') {
      return lista.filter((m) => m.presentado);
    }
    if (filtro === 'PENDIENTES') {
      return lista.filter((m) => !m.presentado);
    }
    return lista;
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrar.emit();
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cerrar.emit();
    }
  }

  onAuditar(idEstadistica?: number, numeroFormulario?: string): void {
    if (idEstadistica) {
      this.auditarFormulario.emit({ idEstadistica, numeroFormulario });
    }
  }

  exportarExcel(): void {
    const h = this.hotel();
    if (h) {
      this.exportService.exportarDetalleHotelExcel(h, this.periodoLabel());
    }
  }

  exportarPdf(): void {
    const h = this.hotel();
    if (h) {
      this.exportService.exportarDetalleHotelPdf(h, this.periodoLabel());
    }
  }
}
