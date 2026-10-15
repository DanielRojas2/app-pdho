import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../../core/services/reportes.service';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { ExportReportesService } from '../../../../core/services/export-reportes.service';
import { CumplimientoDeclaracionesResponse } from '../../../../core/models/reportes.models';
import { EstadisticaHoteleraResponse } from '../../../../core/models/formulario.models';
import { EstablecimientoResponse } from '../../../../core/models/establecimiento.models';
import { ModalRevisionFormularioComponent } from '../../components/modal-revision-formulario/modal-revision-formulario.component';
import {
  ModalDetalleCumplimientoComponent,
  MesDetalleUI,
  HotelCumplimientoModalUI
} from '../../components/modal-detalle-cumplimiento/modal-detalle-cumplimiento.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type ModoFiltroCumplimiento = 'periodo' | 'gestion' | 'rango_fechas';
export type EstadoCumplimientoUI = 'DECLARADO' | 'INCOMPLETO' | 'PENDIENTE' | 'OBSERVADO';

export interface EstablecimientoCumplimientoUI extends HotelCumplimientoModalUI {
  id: number;
  nombre: string;
  categoria: string;
  operador: string;
  telefono: string;
  estado: EstadoCumplimientoUI;
  estadoDetalle?: string;
  fecha?: string;
  nroFormulario?: string;
  id_estadistica?: number | null;
  archivoPdf?: string | null;

  totalMesesEsperados: number;
  totalMesesPresentados: number;
  mesesPresentados: MesDetalleUI[];
  mesesPendientes: MesDetalleUI[];
  todosLosMeses: MesDetalleUI[];
}

interface TargetMesDef {
  mes: string;       // minúscula (ej: "septiembre")
  mesNombre: string; // Título (ej: "Septiembre")
  gestion: number;   // ej: 2026
  mesIndex: number;  // 0 a 11
}

@Component({
  selector: 'app-admin-cumplimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalRevisionFormularioComponent,
    ModalDetalleCumplimientoComponent
  ],
  templateUrl: './cumplimiento.component.html',
  styleUrl: './cumplimiento.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CumplimientoComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly establecimientoService = inject(EstablecimientoService);
  private readonly exportService = inject(ExportReportesService);

  // Catálogo oficial de meses y gestiones
  readonly mesesLista: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  readonly gestionesLista: number[] = [2026, 2025, 2024];

  // Modos de filtrado
  readonly modoFiltro = signal<ModoFiltroCumplimiento>('periodo');

  // Valores de los filtros
  readonly mesSeleccionado = signal<string>('Septiembre');
  readonly gestionSeleccionada = signal<number>(2026);
  readonly fechaInicio = signal<string>('2026-01-01');
  readonly fechaFin = signal<string>('2026-09-30');

  // Estados de carga y filtros
  readonly cargando = signal<boolean>(true);
  readonly errorCarga = signal<string | null>(null);
  readonly exportando = signal<boolean>(false);

  // Pestañas de estado
  readonly filtroEstado = signal<'TODOS' | 'DECLARADO' | 'INCOMPLETO' | 'PENDIENTE' | 'OBSERVADO'>('TODOS');
  readonly terminoBusqueda = signal<string>('');

  // Modales
  readonly formularioParaRevisarId = signal<number | null>(null);
  readonly formularioNumeroSeleccionado = signal<string | null>(null);
  readonly hotelSeleccionadoParaModal = signal<EstablecimientoCumplimientoUI | null>(null);

  // Datos reales consolidados
  readonly listaHoteles = signal<EstablecimientoCumplimientoUI[]>([]);

  // Etiqueta legible del período o rango activo
  readonly etiquetaPeriodoConsultado = computed(() => {
    const modo = this.modoFiltro();
    if (modo === 'periodo') {
      return `Período: ${this.mesSeleccionado()} / ${this.gestionSeleccionada()}`;
    } else if (modo === 'gestion') {
      return `Gestión: ${this.gestionSeleccionada()}`;
    } else {
      return `Rango: ${this.formatearFecha(this.fechaInicio())} al ${this.formatearFecha(this.fechaFin())}`;
    }
  });

  // Hoteles filtrados reactivamente por pestaña de estado y término de búsqueda
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
      incompletos: list.filter((h) => h.estado === 'INCOMPLETO').length,
      pendientes: list.filter((h) => h.estado === 'PENDIENTE').length,
      observados: list.filter((h) => h.estado === 'OBSERVADO').length
    };
  });

  ngOnInit(): void {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Regla de Negocio Explícita:
    // Si el período activo es Octubre 2026, entonces los formularios declarados
    // obligatorios corresponden hasta Septiembre 2026 (último mes concluido).
    const ultimoMesCerradoIndex = now.getMonth() > 0 ? now.getMonth() - 1 : 11;
    const mesInicial = this.mesesLista[ultimoMesCerradoIndex] || 'Septiembre';
    const gestionInicial = now.getMonth() > 0 ? currentYear : currentYear - 1;

    this.mesSeleccionado.set(mesInicial);
    this.gestionSeleccionada.set(gestionInicial);

    // Fechas por defecto para rango: desde el 1 de enero hasta el fin de mes del último mes concluido
    const mm = String(ultimoMesCerradoIndex + 1).padStart(2, '0');
    const dd = String(new Date(gestionInicial, ultimoMesCerradoIndex + 1, 0).getDate()).padStart(2, '0');
    this.fechaInicio.set(`${gestionInicial}-01-01`);
    this.fechaFin.set(`${gestionInicial}-${mm}-${dd}`);

    this.cargarDatosCumplimiento();
  }

  // Cambio de modo de filtrado
  setModoFiltro(modo: ModoFiltroCumplimiento): void {
    if (this.modoFiltro() !== modo) {
      this.modoFiltro.set(modo);
      this.filtroEstado.set('TODOS');
      this.cargarDatosCumplimiento();
    }
  }

  // Cambio de período puntual
  cambiarPeriodo(mes: string, gestion: number): void {
    this.mesSeleccionado.set(mes);
    this.gestionSeleccionada.set(gestion);
    this.cargarDatosCumplimiento();
  }

  // Cambio de gestión completa
  cambiarGestion(gestion: number): void {
    this.gestionSeleccionada.set(gestion);
    this.cargarDatosCumplimiento();
  }

  // Aplicar rango de fechas
  aplicarRangoFechas(): void {
    if (!this.fechaInicio() || !this.fechaFin()) return;
    if (this.fechaInicio() > this.fechaFin()) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    this.cargarDatosCumplimiento();
  }

  // Cargar datos consolidados desde la API
  cargarDatosCumplimiento(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    const modo = this.modoFiltro();

    if (modo === 'periodo') {
      this.cargarModoPeriodo();
    } else if (modo === 'gestion') {
      this.cargarModoGestion();
    } else {
      this.cargarModoRangoFechas();
    }
  }

  // 1. Carga para Modo Período (1 Mes específico)
  private cargarModoPeriodo(): void {
    const mes = this.mesSeleccionado();
    const gestion = this.gestionSeleccionada();
    const mesLower = mes.toLowerCase();

    forkJoin({
      cumplimiento: this.reportesService.getCumplimientoDeclaraciones(mes, gestion).pipe(
        catchError((err) => {
          console.warn('Error en getCumplimientoDeclaraciones:', err);
          return of({
            mes,
            gestion,
            total_establecimientos: 0,
            total_al_dia: 0,
            total_pendientes: 0,
            porcentaje_cumplimiento: 0,
            establecimientos: []
          } as CumplimientoDeclaracionesResponse);
        })
      ),
      establecimientos: this.establecimientoService.listar({ limit: 100 }),
      estadisticas: this.formulariosService.listarEstadisticas({ limit: 100 }).pipe(
        catchError(() => of([] as EstadisticaHoteleraResponse[]))
      )
    }).subscribe({
      next: ({ cumplimiento, establecimientos, estadisticas }) => {
        // Filtrar estadísticas pertinentes al mes y gestión consultados
        const estadisticasMes = (estadisticas || []).filter(
          (est) =>
            Number(est.gestion) === Number(gestion) &&
            this.normalizarMes(est.mes) === this.normalizarMes(mesLower)
        );
        this.procesarDatosModoPeriodo(cumplimiento, establecimientos, estadisticasMes, mes, gestion);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte de cumplimiento:', err);
        this.errorCarga.set('No se pudo obtener el reporte de cumplimiento desde la API.');
        this.cargando.set(false);
      }
    });
  }

  // 2. Carga para Modo Gestión (Año completo)
  private cargarModoGestion(): void {
    const gestion = this.gestionSeleccionada();

    // Regla de Negocio:
    // Si la gestión es la actual (2026), los meses evaluados son hasta el mes anterior concluido (Septiembre).
    // Si la gestión es anterior (ej. 2025), se evalúan los 12 meses de ese año.
    const now = new Date();
    const currentYear = now.getFullYear();
    const maxMonthIndex = gestion === currentYear ? (now.getMonth() > 0 ? now.getMonth() - 1 : 11) : 11;

    const targetMeses: TargetMesDef[] = [];
    for (let i = 0; i <= maxMonthIndex; i++) {
      targetMeses.push({
        mes: this.mesesLista[i].toLowerCase(),
        mesNombre: this.mesesLista[i],
        gestion,
        mesIndex: i
      });
    }

    forkJoin({
      establecimientos: this.establecimientoService.listar({ limit: 100 }),
      estadisticas: this.formulariosService.listarEstadisticas({ limit: 100 }).pipe(
        catchError(() => of([] as EstadisticaHoteleraResponse[]))
      )
    }).subscribe({
      next: ({ establecimientos, estadisticas }) => {
        this.procesarDatosMultiMes(establecimientos, estadisticas || [], targetMeses);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte por gestión:', err);
        this.errorCarga.set('No se pudo obtener el reporte por gestión desde la API.');
        this.cargando.set(false);
      }
    });
  }

  // 3. Carga para Modo Rango de Fechas
  private cargarModoRangoFechas(): void {
    const inicioStr = this.fechaInicio();
    const finStr = this.fechaFin();

    const targetMeses = this.calcularMesesEnRango(inicioStr, finStr);
    if (targetMeses.length === 0) {
      this.listaHoteles.set([]);
      this.cargando.set(false);
      return;
    }

    forkJoin({
      establecimientos: this.establecimientoService.listar({ limit: 100 }),
      estadisticas: this.formulariosService.listarEstadisticas({ limit: 100 }).pipe(
        catchError(() => of([] as EstadisticaHoteleraResponse[]))
      )
    }).subscribe({
      next: ({ establecimientos, estadisticas }) => {
        this.procesarDatosMultiMes(establecimientos, estadisticas || [], targetMeses);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar reporte por rango de fechas:', err);
        this.errorCarga.set('No se pudo obtener el reporte por rango de fechas desde la API.');
        this.cargando.set(false);
      }
    });
  }

  // Procesamiento para Modo Período (1 mes)
  private procesarDatosModoPeriodo(
    cumplimiento: CumplimientoDeclaracionesResponse,
    establecimientos: EstablecimientoResponse[],
    estadisticas: EstadisticaHoteleraResponse[],
    mesNombre: string,
    gestion: number
  ): void {
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

    const estadisticaMap = new Map<number, EstadisticaHoteleraResponse>();
    (estadisticas || []).forEach((est) => {
      estadisticaMap.set(Number(est.id_establecimiento), est);
    });

    // Base de establecimientos
    const baseItems = (cumplimiento.establecimientos && cumplimiento.establecimientos.length > 0)
      ? cumplimiento.establecimientos
      : (establecimientos || []).map((e) => ({
          id_establecimiento: e.id,
          nombre_establecimiento: e.nombre_establecimiento,
          categoria: e.categoria,
          telefono: e.telefono,
          tiene_estadistica: estadisticaMap.has(e.id),
          id_estadistica: estadisticaMap.get(e.id)?.id || null,
          estado_estadistica: estadisticaMap.get(e.id)?.estado || null,
          tiene_ocupacion: false,
          id_ocupacion: null,
          estado_ocupacion: null,
          cumplimiento_completo: estadisticaMap.has(e.id)
        }));

    const items: EstablecimientoCumplimientoUI[] = baseItems.map((item) => {
      const est = estadisticaMap.get(Number(item.id_establecimiento));
      const operador = operadorMap.get(Number(item.id_establecimiento)) || 'Sin Asignar';
      const telefono = item.telefono || telefonoMap.get(Number(item.id_establecimiento)) || '—';

      let estado: EstadoCumplimientoUI = 'PENDIENTE';
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

      const mesDetalle: MesDetalleUI = {
        mes: mesNombre,
        gestion,
        presentado: estado === 'DECLARADO' || estado === 'OBSERVADO',
        estado,
        fechaPresentacion: fecha,
        nroFormulario,
        idEstadistica: est?.id || item.id_estadistica || undefined,
        archivoPdf: est?.archivo_pdf || null
      };

      const mesesPresentados = mesDetalle.presentado ? [mesDetalle] : [];
      const mesesPendientes = !mesDetalle.presentado ? [mesDetalle] : [];

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
        archivoPdf: est?.archivo_pdf || null,
        totalMesesEsperados: 1,
        totalMesesPresentados: mesesPresentados.length,
        mesesPresentados,
        mesesPendientes,
        todosLosMeses: [mesDetalle]
      };
    });

    this.listaHoteles.set(items);
  }

  // Procesamiento para Rangos de Fechas y Gestiones Completas
  private procesarDatosMultiMes(
    establecimientos: EstablecimientoResponse[],
    estadisticas: EstadisticaHoteleraResponse[],
    targetMeses: TargetMesDef[]
  ): void {
    const totalEsperados = targetMeses.length;

    // Agrupar estadísticas por id_establecimiento asegurando compatibilidad numérica
    const estPorHotel = new Map<number, EstadisticaHoteleraResponse[]>();
    (estadisticas || []).forEach((est) => {
      const hotelId = Number(est.id_establecimiento);
      const arr = estPorHotel.get(hotelId) || [];
      arr.push(est);
      estPorHotel.set(hotelId, arr);
    });

    const items: EstablecimientoCumplimientoUI[] = (establecimientos || []).map((e) => {
      const operador = e.operador?.nombre_completo || 'Sin Asignar';
      const telefono = e.telefono || '—';
      const hotelEsts = estPorHotel.get(Number(e.id)) || [];

      const mesesPresentados: MesDetalleUI[] = [];
      const mesesPendientes: MesDetalleUI[] = [];
      const todosLosMeses: MesDetalleUI[] = [];

      let ultimaFecha: string | undefined;
      let ultimoNroFormulario: string | undefined;
      let ultimoIdEst: number | null = null;
      let tieneObservado = false;

      targetMeses.forEach((t) => {
        // Búsqueda insensible a mayúsculas y acentos
        const match = hotelEsts.find(
          (est) =>
            Number(est.gestion) === Number(t.gestion) &&
            this.normalizarMes(est.mes) === this.normalizarMes(t.mes)
        );

        if (match) {
          const estadoMes = match.estado === 'OBSERVADO' ? 'OBSERVADO' : 'DECLARADO';
          if (match.estado === 'OBSERVADO') {
            tieneObservado = true;
          }

          const fechaFormateada = match.fecha_presentacion
            ? this.formatearFecha(match.fecha_presentacion)
            : undefined;

          const nroForm = match.numero_formulario || String(match.id).padStart(6, '0');

          ultimaFecha = fechaFormateada || ultimaFecha;
          ultimoNroFormulario = nroForm || ultimoNroFormulario;
          ultimoIdEst = match.id || ultimoIdEst;

          const mesItem: MesDetalleUI = {
            mes: t.mesNombre,
            gestion: t.gestion,
            presentado: true,
            estado: estadoMes,
            estadoDetalle: match.estado,
            fechaPresentacion: fechaFormateada,
            nroFormulario: nroForm,
            idEstadistica: match.id,
            archivoPdf: match.archivo_pdf || null
          };

          mesesPresentados.push(mesItem);
          todosLosMeses.push(mesItem);
        } else {
          const mesItem: MesDetalleUI = {
            mes: t.mesNombre,
            gestion: t.gestion,
            presentado: false,
            estado: 'PENDIENTE',
            estadoDetalle: 'Sin Presentar'
          };

          mesesPendientes.push(mesItem);
          todosLosMeses.push(mesItem);
        }
      });

      // LÓGICA DE ESTADO:
      // Si presentó todos los meses del rango -> DECLARADO (o OBSERVADO)
      // Si presentó 0 meses -> PENDIENTE
      // Si no tiene todo completo (0 < presentados < esperados) -> INCOMPLETO
      let estado: EstadoCumplimientoUI = 'PENDIENTE';
      const cantPresentados = mesesPresentados.length;

      if (cantPresentados === totalEsperados && totalEsperados > 0) {
        estado = tieneObservado ? 'OBSERVADO' : 'DECLARADO';
      } else if (cantPresentados > 0 && cantPresentados < totalEsperados) {
        estado = 'INCOMPLETO';
      } else {
        estado = 'PENDIENTE';
      }

      return {
        id: e.id,
        nombre: e.nombre_establecimiento,
        categoria: this.formatearCategoria(e.categoria),
        operador,
        telefono,
        estado,
        estadoDetalle: `${cantPresentados} de ${totalEsperados} presentados`,
        fecha: ultimaFecha,
        nroFormulario: ultimoNroFormulario,
        id_estadistica: ultimoIdEst,
        archivoPdf: null,
        totalMesesEsperados: totalEsperados,
        totalMesesPresentados: cantPresentados,
        mesesPresentados,
        mesesPendientes,
        todosLosMeses
      };
    });

    this.listaHoteles.set(items);
  }

  // Auxiliar: Extraer lista ordenada de meses entre dos fechas respetando la zona horaria local
  // y la regla de negocio de que el mes activo (octubre) aún no se exige si no ha concluido
  private calcularMesesEnRango(inicioStr: string, finStr: string): TargetMesDef[] {
    const list: TargetMesDef[] = [];
    try {
      if (!inicioStr || !finStr) return list;

      const [startYear, startMonth] = inicioStr.split('-').map(Number);
      const [endYear, endMonth] = finStr.split('-').map(Number);

      if (!startYear || !startMonth || !endYear || !endMonth) return list;

      const now = new Date();
      const currentYear = now.getFullYear();
      // Si el mes actual es Octubre (index 9), el último mes cerrado es Septiembre (index 8)
      const maxClosedMonthIndex = now.getMonth() > 0 ? now.getMonth() - 1 : 11;

      let curYear = startYear;
      let curMonth = startMonth; // 1 a 12

      while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
        const mIndex = curMonth - 1;

        // Regla de Negocio: Si el año evaluado es el actual, no se exige el mes activo en curso (Octubre)
        // porque los formularios presentados son hasta el mes anterior concluido (Septiembre).
        if (curYear > currentYear || (curYear === currentYear && mIndex > maxClosedMonthIndex)) {
          break;
        }

        list.push({
          mes: this.mesesLista[mIndex].toLowerCase(),
          mesNombre: this.mesesLista[mIndex],
          gestion: curYear,
          mesIndex: mIndex
        });

        curMonth++;
        if (curMonth > 12) {
          curMonth = 1;
          curYear++;
        }
      }
    } catch (err) {
      console.warn('Error calculando meses en rango:', err);
    }
    return list;
  }

  // Normalizador de texto para comparar meses
  private normalizarMes(m?: string): string {
    if (!m) return '';
    return m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  // Modales
  abrirModalDetalle(h: EstablecimientoCumplimientoUI): void {
    this.hotelSeleccionadoParaModal.set(h);
  }

  cerrarModalDetalle(): void {
    this.hotelSeleccionadoParaModal.set(null);
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
    this.cargarDatosCumplimiento();
  }

  // Pestañas de estado
  setFiltro(estado: 'TODOS' | 'DECLARADO' | 'INCOMPLETO' | 'PENDIENTE' | 'OBSERVADO'): void {
    this.filtroEstado.set(estado);
  }

  onBuscar(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.terminoBusqueda.set(val);
  }

  // Exportaciones solicitadas: Excel (.xlsx) y PDF (.pdf)
  exportarExcel(): void {
    this.exportService.exportarCumplimientoExcel(
      this.hotelesFiltrados(),
      this.etiquetaPeriodoConsultado(),
      this.resumen()
    );
  }

  exportarPdf(): void {
    this.exportService.exportarCumplimientoPdf(
      this.hotelesFiltrados(),
      this.etiquetaPeriodoConsultado(),
      this.resumen()
    );
  }

  // Formateadores institucionales
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
}
