import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../../core/services/reportes.service';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { CumplimientoDeclaracionesResponse } from '../../../../core/models/reportes.models';
import { EstadisticaHoteleraResponse } from '../../../../core/models/formulario.models';
import { EstablecimientoResponse } from '../../../../core/models/establecimiento.models';
import { ModalRevisionFormularioComponent } from '../../components/modal-revision-formulario/modal-revision-formulario.component';
import { forkJoin } from 'rxjs';

export interface EstablecimientoCumplimientoUI {
  id: number;
  nombre: string;
  categoria: string;
  operador: string;
  telefono: string;
  estado: 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO';
  estadoDetalle?: string;
  fecha?: string;
  nroFormulario?: string;
  id_estadistica?: number | null;
  archivoPdf?: string | null;
}

@Component({
  selector: 'app-admin-cumplimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalRevisionFormularioComponent],
  templateUrl: './cumplimiento.component.html',
  styleUrl: './cumplimiento.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CumplimientoComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly establecimientoService = inject(EstablecimientoService);

  // Período de consulta
  readonly mesesLista: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  readonly gestionesLista: number[] = [2026, 2025];

  readonly mesSeleccionado = signal<string>('Octubre');
  readonly gestionSeleccionada = signal<number>(2026);

  // Estados de carga y filtros
  readonly cargando = signal<boolean>(true);
  readonly errorCarga = signal<string | null>(null);
  readonly exportando = signal<boolean>(false);

  readonly filtroEstado = signal<'TODOS' | 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO'>('TODOS');
  readonly terminoBusqueda = signal<string>('');

  // Modal de revisión y aprobación institucional
  readonly formularioParaRevisarId = signal<number | null>(null);
  readonly formularioNumeroSeleccionado = signal<string | null>(null);

  // Datos reales consolidados
  readonly listaHoteles = signal<EstablecimientoCumplimientoUI[]>([]);

  // Hoteles filtrados reactivamente por pestaña de estado y búsqueda
  readonly hotelesFiltrados = computed(() => {
    const estado = this.filtroEstado();
    const query = this.terminoBusqueda().toLowerCase().trim();

    return this.listaHoteles().filter((h) => {
      const coincideEstado = estado === 'TODOS' || h.estado === estado;
      const coincideBusqueda =
        !query ||
        h.nombre.toLowerCase().includes(query) ||
        h.categoria.toLowerCase().includes(query) ||
        h.operador.toLowerCase().includes(query) ||
        (h.nroFormulario && h.nroFormulario.toLowerCase().includes(query));
      return coincideEstado && coincideBusqueda;
    });
  });

  // Resumen cuantitativo para los badges superiores
  readonly resumen = computed(() => {
    const list = this.listaHoteles();
    return {
      total: list.length,
      declarados: list.filter((h) => h.estado === 'DECLARADO').length,
      pendientes: list.filter((h) => h.estado === 'PENDIENTE').length,
      observados: list.filter((h) => h.estado === 'OBSERVADO').length
    };
  });

  ngOnInit(): void {
    // Inicializar con el mes y gestión actuales
    const now = new Date();
    const mesActual = this.mesesLista[now.getMonth()] || 'Octubre';
    const gestionActual = now.getFullYear();
    this.mesSeleccionado.set(mesActual);
    this.gestionSeleccionada.set(gestionActual);

    this.cargarDatosCumplimiento();
  }

  cambiarPeriodo(mes: string, gestion: number): void {
    this.mesSeleccionado.set(mes);
    this.gestionSeleccionada.set(gestion);
    this.cargarDatosCumplimiento();
  }

  cargarDatosCumplimiento(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    const mes = this.mesSeleccionado();
    const gestion = this.gestionSeleccionada();

    forkJoin({
      cumplimiento: this.reportesService.getCumplimientoDeclaraciones(mes, gestion),
      establecimientos: this.establecimientoService.listar({ limit: 100 }),
      estadisticas: this.formulariosService.listarEstadisticas({ mes, gestion, limit: 100 })
    }).subscribe({
      next: ({ cumplimiento, establecimientos, estadisticas }) => {
        this.procesarDatos(cumplimiento, establecimientos, estadisticas);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte de cumplimiento:', err);
        this.errorCarga.set('No se pudo obtener el reporte de cumplimiento desde la API.');
        this.cargando.set(false);
      }
    });
  }

  private procesarDatos(
    cumplimiento: CumplimientoDeclaracionesResponse,
    establecimientos: EstablecimientoResponse[],
    estadisticas: EstadisticaHoteleraResponse[]
  ): void {
    // Mapa de establecimientos con operador responsable
    const operadorMap = new Map<number, string>();
    const telefonoMap = new Map<number, string>();

    (establecimientos || []).forEach((e) => {
      if (e.operador?.nombre_completo) {
        operadorMap.set(e.id, e.operador.nombre_completo);
      }
      if (e.telefono) {
        telefonoMap.set(e.id, e.telefono);
      }
    });

    // Mapa de estadísticas por id_establecimiento
    const estadisticaMap = new Map<number, EstadisticaHoteleraResponse>();
    (estadisticas || []).forEach((est) => {
      estadisticaMap.set(est.id_establecimiento, est);
    });

    const items: EstablecimientoCumplimientoUI[] = (cumplimiento.establecimientos || []).map((item) => {
      const est = estadisticaMap.get(item.id_establecimiento);
      const operador = operadorMap.get(item.id_establecimiento) || 'Sin Asignar';
      const telefono = item.telefono || telefonoMap.get(item.id_establecimiento) || '—';

      // Determinar estado de cumplimiento
      let estado: 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO' = 'PENDIENTE';
      if (
        item.estado_estadistica === 'OBSERVADO' ||
        item.estado_ocupacion === 'OBSERVADO' ||
        est?.estado === 'OBSERVADO'
      ) {
        estado = 'OBSERVADO';
      } else if (item.tiene_estadistica || item.cumplimiento_completo || est) {
        estado = 'DECLARADO';
      }

      const nroFormulario = est?.numero_formulario
        ? est.numero_formulario
        : item.id_estadistica
        ? String(item.id_estadistica).padStart(6, '0')
        : undefined;

      const fecha = est?.fecha_presentacion
        ? this.formatearFecha(est.fecha_presentacion)
        : undefined;

      return {
        id: item.id_establecimiento,
        nombre: item.nombre_establecimiento,
        categoria: this.formatearCategoria(item.categoria),
        operador,
        telefono,
        estado,
        estadoDetalle: item.estado_estadistica || est?.estado || undefined,
        fecha,
        nroFormulario,
        id_estadistica: est?.id || item.id_estadistica || null,
        archivoPdf: est?.archivo_pdf || null
      };
    });

    this.listaHoteles.set(items);
  }

  setFiltro(estado: 'TODOS' | 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO'): void {
    this.filtroEstado.set(estado);
  }

  onBuscar(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.terminoBusqueda.set(val);
  }

  descargarReporteCsv(): void {
    this.exportando.set(true);
    const mes = this.mesSeleccionado();
    const gestion = this.gestionSeleccionada();

    this.reportesService.descargarCsv({ mes, gestion }).subscribe({
      next: (blob) => {
        this.exportando.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cumplimiento_${mes.toLowerCase()}_${gestion}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar CSV:', err);
        this.exportando.set(false);
        alert('No se pudo generar el archivo CSV en este momento.');
      }
    });
  }

  formatearCategoria(cat?: string | null): string {
    if (!cat) return 'Hospedaje';
    const normalizada = cat.toLowerCase().trim();
    const mapa: Record<string, string> = {
      '5_estrellas': '5 Estrellas',
      '4_estrellas': '4 Estrellas',
      '3_estrellas': '3 Estrellas',
      '2_estrellas': '2 Estrellas',
      '1_estrella': '1 Estrella',
      'alojamiento': 'Alojamiento',
      'residencial': 'Residencial',
      'hostal': 'Hostal',
      'hotel_boutique': 'Hotel Boutique',
      'casa_huespedes': 'Casa de Huéspedes',
      'sin_categoria': 'Sin Categoría'
    };
    return mapa[normalizada] || cat;
  }

  formatearFecha(fechaStr?: string | null): string {
    if (!fechaStr) return '—';
    try {
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return fechaStr;
      return fecha.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  }

  abrirRevision(idEstadistica: number, numeroFormulario?: string): void {
    this.formularioNumeroSeleccionado.set(numeroFormulario || null);
    this.formularioParaRevisarId.set(idEstadistica);
  }

  cerrarRevision(): void {
    this.formularioParaRevisarId.set(null);
    this.formularioNumeroSeleccionado.set(null);
  }

  onFormularioActualizado(actualizado: EstadisticaHoteleraResponse): void {
    this.listaHoteles.update((list) =>
      list.map((h) => {
        if (h.id_estadistica === actualizado.id || h.id === actualizado.id_establecimiento) {
          const nuevoEstado =
            actualizado.estado === 'OBSERVADO'
              ? 'OBSERVADO'
              : actualizado.estado === 'APROBADO' || actualizado.estado === 'ENVIADO'
              ? 'DECLARADO'
              : h.estado;
          return {
            ...h,
            estado: nuevoEstado,
            estadoDetalle: actualizado.estado,
            fecha: this.formatearFecha(actualizado.fecha_presentacion),
            nroFormulario: actualizado.numero_formulario || h.nroFormulario,
            id_estadistica: actualizado.id
          };
        }
        return h;
      })
    );
  }
}

