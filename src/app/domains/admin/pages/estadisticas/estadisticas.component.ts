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
import { ToastService } from '../../../../core/services/toast.service';
import {
  NacionalidadRankingItem,
  SerieComparativaItem,
  GraficoTortaNacionalesExtranjerosResponse,
  FiltroReportesParam
} from '../../../../core/models/reportes.models';
import { Nacionalidad } from '../../../../core/models/nacionalidad.models';

export type TipoFormularioTab = 'f1' | 'f2' | 'f3';
export type TipoFiltroF1 = 'ingresos' | 'permanencias' | 'combinado' | 'torta';
export type MetricaTorta = 'ingresos' | 'permanencias' | 'combinado';
export type ModoFiltroPeriodo = 'mes' | 'rango';
export type FormatoExportar = 'pdf';

export const MESES_DISPONIBLES: readonly string[] = [
  'Todos los meses',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

export const GESTIONES_DISPONIBLES: readonly number[] = [2026, 2025, 2024];

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadisticasComponent implements OnInit {
  private readonly reportesService = inject(ReportesService);
  private readonly toastService = inject(ToastService);

  // 1. Pestañas de Formulario (Formulario 1, Formulario 2, Formulario 3)
  readonly formularioActivo = signal<TipoFormularioTab>('f1');

  // 2. Filtro de visualización para Formulario 1 (4 opciones especificadas)
  readonly filtroVisualizacionF1 = signal<TipoFiltroF1>('ingresos');

  // Switch de Métrica para Gráfico de Torta (Opción 4: Ingresos, Permanencias, Combinado)
  readonly tortaMetrica = signal<MetricaTorta>('ingresos');

  // Filtros de Período (Modo Mes vs Modo Rango de Fechas)
  readonly modoFiltroPeriodo = signal<ModoFiltroPeriodo>('mes');
  readonly mesSeleccionado = signal<string>('Septiembre');
  readonly gestionSeleccionada = signal<number>(2026);
  readonly fechaInicio = signal<string>('2026-09-01');
  readonly fechaFin = signal<string>('2026-09-30');
  readonly mesesLista = MESES_DISPONIBLES;
  readonly gestionesLista = GESTIONES_DISPONIBLES;

  // Estado de Carga
  readonly cargando = signal<boolean>(false);

  // 3. Selector de Países a Ver (Panel Derecho - Dinámico según el período consultado)
  readonly todosLosPaises = signal<boolean>(true);
  readonly codigosPaisesSeleccionados = signal<string[]>([]);
  readonly busquedaPais = signal<string>('');

  // Datos del backend
  readonly catalogoNacionalidades = signal<Nacionalidad[]>([]);
  readonly rankingItems = signal<NacionalidadRankingItem[]>([]);
  readonly comparativaSeries = signal<SerieComparativaItem[]>([]);
  readonly tortaData = signal<GraficoTortaNacionalesExtranjerosResponse | null>(null);

  // 4. Modal de Exportación y Modo Impresión
  readonly modalExportarAbierto = signal<boolean>(false);
  readonly modoImpresion = signal<boolean>(false);
  readonly formatoExportar = signal<FormatoExportar>('pdf');
  readonly exportarGraficoIngresos = signal<boolean>(true);
  readonly exportarGraficoPermanencias = signal<boolean>(true);
  readonly exportarGraficoCombinado = signal<boolean>(true);
  readonly exportarGraficoTorta = signal<boolean>(true);

  // Tooltip interactivo para gráficos
  readonly tooltipVisible = signal<boolean>(false);
  readonly tooltipTitulo = signal<string>('');
  readonly tooltipValor1 = signal<string>('');
  readonly tooltipValor2 = signal<string>('');
  readonly tooltipX = signal<number>(0);
  readonly tooltipY = signal<number>(0);

  // Etiqueta legible del período consultado
  readonly etiquetaPeriodoConsultado = computed<string>(() => {
    if (this.modoFiltroPeriodo() === 'mes') {
      return `${this.mesSeleccionado()} / ${this.gestionSeleccionada()}`;
    }
    return `Del ${this.formatearFechaCorta(this.fechaInicio())} al ${this.formatearFechaCorta(this.fechaFin())}`;
  });

  // Fecha y hora de emisión para el reporte
  readonly fechaEmisionReporte = computed<string>(() => {
    return new Date().toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // Lista dinámica de países que tuvieron registros en el período consultado
  readonly listaPaisesDisponibles = computed<{ pais: string; cod_pais: string }[]>(() => {
    const mapa = new Map<string, string>();

    // ÚNICAMENTE incluir los países que efectivamente se registraron en el período
    this.rankingItems().forEach((r) => {
      if (r.cod_pais && (r.cant_ingresos > 0 || r.cant_permanencias > 0 || r.total_afluencia > 0)) {
        mapa.set(r.cod_pais.toUpperCase(), r.pais);
      }
    });

    this.comparativaSeries().forEach((c) => {
      if (c.codigo && (c.ingresos > 0 || c.permanencias > 0 || c.total > 0)) {
        mapa.set(c.codigo.toUpperCase(), c.etiqueta);
      }
    });

    const items: { pais: string; cod_pais: string }[] = [];
    mapa.forEach((pais, cod_pais) => {
      items.push({ pais, cod_pais });
    });

    // Ordenar con Bolivia primero (si existe), luego alfabético
    return items.sort((a, b) => {
      if (a.cod_pais === 'BO') return -1;
      if (b.cod_pais === 'BO') return 1;
      return a.pais.localeCompare(b.pais);
    });
  });

  // Lista de países filtrada por el buscador del selector
  readonly listaPaisesFiltradaPorBusqueda = computed(() => {
    const query = this.normalizarTexto(this.busquedaPais());
    const lista = this.listaPaisesDisponibles();
    if (!query) return lista;
    return lista.filter(
      (p) =>
        this.normalizarTexto(p.pais).includes(query) ||
        this.normalizarTexto(p.cod_pais).includes(query)
    );
  });

  // Set de códigos seleccionados para búsqueda rápida O(1)
  readonly setCodigosSeleccionados = computed(() => {
    return new Set(this.codigosPaisesSeleccionados().map((c) => c.toUpperCase()));
  });

  // Items de datos filtrados por países seleccionados
  readonly itemsRankingFiltrados = computed<NacionalidadRankingItem[]>(() => {
    const raw = this.rankingItems();
    if (this.todosLosPaises()) return raw;
    const seleccionados = this.setCodigosSeleccionados();
    return raw.filter((item) => seleccionados.has(item.cod_pais.toUpperCase()));
  });

  readonly seriesComparativaFiltradas = computed<SerieComparativaItem[]>(() => {
    const raw = this.comparativaSeries();
    if (this.todosLosPaises()) return raw;
    const seleccionados = this.setCodigosSeleccionados();
    return raw.filter((item) =>
      item.codigo ? seleccionados.has(item.codigo.toUpperCase()) : false
    );
  });

  // Totales y escalas para gráficos de barras
  readonly maxValorIngresos = computed<number>(() => {
    const max = Math.max(...this.itemsRankingFiltrados().map((i) => i.cant_ingresos), 1);
    return Math.ceil(max * 1.15);
  });

  readonly maxValorPermanencias = computed<number>(() => {
    const max = Math.max(...this.itemsRankingFiltrados().map((i) => i.cant_permanencias), 1);
    return Math.ceil(max * 1.15);
  });

  readonly maxValorCombinado = computed<number>(() => {
    const max = Math.max(
      ...this.seriesComparativaFiltradas().map((i) => Math.max(i.ingresos, i.permanencias)),
      1
    );
    return Math.ceil(max * 1.15);
  });

  // Totales calculados de Ingresos en la vista actual
  readonly totalIngresosActual = computed<number>(() => {
    return this.itemsRankingFiltrados().reduce((acc, curr) => acc + curr.cant_ingresos, 0);
  });

  // Totales calculados de Permanencias en la vista actual
  readonly totalPermanenciasActual = computed<number>(() => {
    return this.itemsRankingFiltrados().reduce((acc, curr) => acc + curr.cant_permanencias, 0);
  });

  // Total General Afluencia Actual
  readonly totalAfluenciaActual = computed<number>(() => {
    return this.totalIngresosActual() + this.totalPermanenciasActual();
  });

  // Datos para Gráfico de Torta (Opción 4: Ingresos, Permanencias o Combinado)
  readonly datosTortaCalculados = computed(() => {
    const torta = this.tortaData();
    const metrica = this.tortaMetrica();

    if (!torta) {
      return {
        total: 10000,
        nacionalesCant: 7000,
        extranjerosCant: 3000,
        nacionalesPct: 70,
        extranjerosPct: 30,
        labelMetrica: metrica === 'ingresos' ? 'Ingresos de Huéspedes' : (metrica === 'permanencias' ? 'Noches de Pernoctación' : 'Total Afluencia Combinada'),
        unidad: metrica === 'ingresos' ? 'huéspedes' : (metrica === 'permanencias' ? 'noches' : 'movimientos')
      };
    }

    if (metrica === 'ingresos') {
      const nac = torta.nacionales.cant_ingresos;
      const ext = torta.extranjeros.cant_ingresos;
      const tot = torta.totales_generales.total_ingresos || nac + ext || 1;
      const nacPct = Math.round((nac / tot) * 1000) / 10;
      const extPct = Math.round((ext / tot) * 1000) / 10;
      return {
        total: tot,
        nacionalesCant: nac,
        extranjerosCant: ext,
        nacionalesPct: nacPct,
        extranjerosPct: extPct,
        labelMetrica: 'Ingresos de Huéspedes (Llegadas)',
        unidad: 'huéspedes'
      };
    } else if (metrica === 'permanencias') {
      const nac = torta.nacionales.cant_permanencias;
      const ext = torta.extranjeros.cant_permanencias;
      const tot = torta.totales_generales.total_permanencias || nac + ext || 1;
      const nacPct = Math.round((nac / tot) * 1000) / 10;
      const extPct = Math.round((ext / tot) * 1000) / 10;
      return {
        total: tot,
        nacionalesCant: nac,
        extranjerosCant: ext,
        nacionalesPct: nacPct,
        extranjerosPct: extPct,
        labelMetrica: 'Pernoctaciones (Noches de Estadía)',
        unidad: 'noches'
      };
    } else {
      // Tercera opción: Combinado (Total Afluencia = Ingresos + Pernoctaciones)
      const nac = (torta.nacionales.total ?? 0) || (torta.nacionales.cant_ingresos + torta.nacionales.cant_permanencias);
      const ext = (torta.extranjeros.total ?? 0) || (torta.extranjeros.cant_ingresos + torta.extranjeros.cant_permanencias);
      const tot = (torta.totales_generales.total_general ?? 0) || (nac + ext) || 1;
      const nacPct = Math.round((nac / tot) * 1000) / 10;
      const extPct = Math.round((ext / tot) * 1000) / 10;
      return {
        total: tot,
        nacionalesCant: nac,
        extranjerosCant: ext,
        nacionalesPct: nacPct,
        extranjerosPct: extPct,
        labelMetrica: 'Combinado: Total Afluencia (Ingresos + Pernoctaciones)',
        unidad: 'movimientos'
      };
    }
  });

  // Cálculo SVG Donut Arcs (stroke-dasharray)
  readonly radioDonut = 80;
  readonly circunferenciaDonut = 2 * Math.PI * 80; // ~502.65

  readonly donutStrokeNacionales = computed<string>(() => {
    const pct = this.datosTortaCalculados().nacionalesPct / 100;
    const len = pct * this.circunferenciaDonut;
    return `${len} ${this.circunferenciaDonut}`;
  });

  readonly donutStrokeExtranjeros = computed<string>(() => {
    const pct = this.datosTortaCalculados().extranjerosPct / 100;
    const len = pct * this.circunferenciaDonut;
    return `${len} ${this.circunferenciaDonut}`;
  });

  readonly donutOffsetExtranjeros = computed<number>(() => {
    const nacPct = this.datosTortaCalculados().nacionalesPct / 100;
    return -(nacPct * this.circunferenciaDonut);
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Carga de datos unificada (aplica modo Mes o modo Rango de Fechas)
  cargarDatos(): void {
    this.cargando.set(true);

    const filtros: FiltroReportesParam = {};
    if (this.modoFiltroPeriodo() === 'mes') {
      filtros.mes = this.mesSeleccionado() === 'Todos los meses' ? undefined : this.mesSeleccionado();
      filtros.gestion = this.gestionSeleccionada();
    } else {
      filtros.fecha_inicio = this.fechaInicio();
      filtros.fecha_fin = this.fechaFin();
    }

    // 1. Catálogo de nacionalidades
    this.reportesService.getNacionalidades().subscribe({
      next: (nacs) => this.catalogoNacionalidades.set(nacs),
      error: () => {}
    });

    // 2. Ranking para barras individuales
    this.reportesService.getGraficoRanking(filtros).subscribe({
      next: (res) => {
        const combinados = [...res.top_10, ...(res.resto || [])];
        this.rankingItems.set(combinados);
        this.actualizarCodigosPaisesRegistrados(combinados, this.comparativaSeries());
      },
      error: (err) => console.error('Error al cargar ranking:', err)
    });

    // 3. Comparativa combinada
    this.reportesService.getGraficoPermanenciasVsIngresos(filtros).subscribe({
      next: (res) => {
        const series = res.series || [];
        this.comparativaSeries.set(series);
        this.actualizarCodigosPaisesRegistrados(this.rankingItems(), series);
      },
      error: (err) => console.error('Error al cargar comparativa:', err)
    });

    // 4. Gráfico de Torta
    this.reportesService.getGraficoNacionalesExtranjeros(filtros).subscribe({
      next: (res) => {
        this.tortaData.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar torta:', err);
        this.cargando.set(false);
      }
    });
  }

  private actualizarCodigosPaisesRegistrados(
    rankings: NacionalidadRankingItem[],
    series: SerieComparativaItem[]
  ): void {
    const codigos = new Set<string>();
    rankings.forEach((r) => {
      if (r.cod_pais && (r.cant_ingresos > 0 || r.cant_permanencias > 0 || r.total_afluencia > 0)) {
        codigos.add(r.cod_pais.toUpperCase());
      }
    });
    series.forEach((c) => {
      if (c.codigo && (c.ingresos > 0 || c.permanencias > 0 || c.total > 0)) {
        codigos.add(c.codigo.toUpperCase());
      }
    });

    const lista = Array.from(codigos);
    if (this.todosLosPaises() || this.codigosPaisesSeleccionados().length === 0) {
      this.codigosPaisesSeleccionados.set(lista);
    } else {
      // Mantener solo los códigos seleccionados que todavía existan en el nuevo período
      const filtrados = this.codigosPaisesSeleccionados().filter((c) => codigos.has(c.toUpperCase()));
      this.codigosPaisesSeleccionados.set(filtrados.length > 0 ? filtrados : lista);
    }
  }

  // Cambio de modo de período (Mes vs Rango)
  cambiarModoPeriodo(modo: ModoFiltroPeriodo): void {
    this.modoFiltroPeriodo.set(modo);
    this.cargarDatos();
  }

  cambiarMes(mes: string): void {
    this.mesSeleccionado.set(mes);
    this.cargarDatos();
  }

  cambiarGestion(gestion: number): void {
    this.gestionSeleccionada.set(gestion);
    this.cargarDatos();
  }

  cambiarFechaInicio(val: string): void {
    this.fechaInicio.set(val);
  }

  cambiarFechaFin(val: string): void {
    this.fechaFin.set(val);
  }

  aplicarRangoFechas(): void {
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.toastService.warning('Seleccione tanto fecha de inicio como fecha de fin.');
      return;
    }
    this.cargarDatos();
  }

  // Pestañas principales
  seleccionarFormulario(tab: TipoFormularioTab): void {
    this.formularioActivo.set(tab);
  }

  // Filtro de visualización (4 opciones)
  seleccionarFiltroF1(filtro: TipoFiltroF1): void {
    this.filtroVisualizacionF1.set(filtro);
  }

  // Switch de métrica en gráfico de torta (Ingresos, Permanencias, Combinado)
  cambiarTortaMetrica(metrica: MetricaTorta): void {
    this.tortaMetrica.set(metrica);
  }

  // Interacción de Países a Ver
  toggleTodosLosPaises(): void {
    const actual = this.todosLosPaises();
    const nuevo = !actual;
    this.todosLosPaises.set(nuevo);

    if (nuevo) {
      const todos = this.listaPaisesDisponibles().map((p) => p.cod_pais);
      this.codigosPaisesSeleccionados.set(todos);
    }
  }

  togglePais(codPais: string): void {
    const actual = [...this.codigosPaisesSeleccionados()];
    const cod = codPais.toUpperCase();
    const idx = actual.indexOf(cod);

    if (idx >= 0) {
      actual.splice(idx, 1);
    } else {
      actual.push(cod);
    }

    this.codigosPaisesSeleccionados.set(actual);
    this.todosLosPaises.set(actual.length === this.listaPaisesDisponibles().length);
  }

  seleccionarTodosLosPaises(): void {
    const todos = this.listaPaisesDisponibles().map((p) => p.cod_pais);
    this.codigosPaisesSeleccionados.set(todos);
    this.todosLosPaises.set(true);
  }

  deseleccionarTodosLosPaises(): void {
    this.codigosPaisesSeleccionados.set(['BO']); // Al menos Bolivia
    this.todosLosPaises.set(false);
  }

  // Tooltips interactivos
  mostrarTooltip(
    event: MouseEvent,
    titulo: string,
    val1: string,
    val2: string = ''
  ): void {
    this.tooltipTitulo.set(titulo);
    this.tooltipValor1.set(val1);
    this.tooltipValor2.set(val2);
    this.tooltipX.set(event.clientX + 14);
    this.tooltipY.set(event.clientY - 35);
    this.tooltipVisible.set(true);
  }

  ocultarTooltip(): void {
    this.tooltipVisible.set(false);
  }

  // Modal de Exportación
  abrirModalExportar(): void {
    this.modalExportarAbierto.set(true);
  }

  cerrarModalExportar(): void {
    this.modalExportarAbierto.set(false);
  }

  obtenerNombreArchivoReporte(): string {
    if (this.modoFiltroPeriodo() === 'mes') {
      const mes = this.mesSeleccionado() || 'General';
      const gestion = this.gestionSeleccionada() || 2026;
      return `REPORTE-PDHO-${mes}-${gestion}`;
    } else {
      const ini = this.fechaInicio() || '';
      const fin = this.fechaFin() || '';
      return `REPORTE-PDHO-${ini}_al_${fin}`;
    }
  }

  ejecutarExportacion(): void {
    const g1 = this.exportarGraficoIngresos();
    const g2 = this.exportarGraficoPermanencias();
    const g3 = this.exportarGraficoCombinado();
    const g4 = this.exportarGraficoTorta();

    if (!g1 && !g2 && !g3 && !g4) {
      this.toastService.warning('Por favor seleccione al menos un gráfico para exportar.');
      return;
    }

    // 1. Cerrar el modal para que no se superponga ni tape el reporte
    this.modalExportarAbierto.set(false);

    // 2. Establecer el título del documento para que el navegador asigne el nombre del archivo PDF por defecto
    // Formato requerido: REPORTE-PDHO-(Periodo seleccionado)
    const nombreArchivo = this.obtenerNombreArchivoReporte();
    const tituloOriginal = document.title;
    document.title = nombreArchivo;

    // 3. Abrir ventana de impresión nativa (sin toast para no interferir en la captura)
    setTimeout(() => {
      window.print();

      // Restaurar el título original de la página tras abrir el diálogo de impresión
      setTimeout(() => {
        document.title = tituloOriginal;
      }, 800);
    }, 150);
  }

  private generarYDescargarCsv(g1: boolean, g2: boolean, g3: boolean, g4: boolean): void {
    let csv = '\uFEFF'; // BOM para que Excel respete caracteres UTF-8
    const periodo = this.etiquetaPeriodoConsultado();

    csv += `GOBIERNO AUTÓNOMO DEPARTAMENTAL DE ORURO\n`;
    csv += `PLATAFORMA DEPARTAMENTAL HOTELERA ORURO (PDHO) - REPORTE OFICIAL\n`;
    csv += `Período: ${periodo}\n`;
    csv += `Fecha de Emisión: ${new Date().toLocaleDateString('es-BO')}\n\n`;

    if (g1) {
      csv += `1. REPORTE DE INGRESOS (LLEGADAS) DE HUÉSPEDES POR PAÍS\n`;
      csv += `Código,País,Ingresos (Llegadas),Participación (%)\n`;
      this.itemsRankingFiltrados().forEach((r) => {
        csv += `"${r.cod_pais}","${r.pais}",${r.cant_ingresos},${r.porcentaje_del_total}%\n`;
      });
      csv += `TOTAL INGRESOS,,${this.totalIngresosActual()},100%\n\n`;
    }

    if (g2) {
      csv += `2. REPORTE DE PERMANENCIAS (PERNOCTACIONES) POR PAÍS\n`;
      csv += `Código,País,Permanencias (Noches)\n`;
      this.itemsRankingFiltrados().forEach((r) => {
        csv += `"${r.cod_pais}","${r.pais}",${r.cant_permanencias}\n`;
      });
      csv += `TOTAL PERNOCTACIONES,,${this.totalPermanenciasActual()}\n\n`;
    }

    if (g3) {
      csv += `3. REPORTE COMPARATIVO COMBINADO (INGRESOS VS PERMANENCIAS)\n`;
      csv += `Código,País,Ingresos,Permanencias,Total Afluencia,Ratio Noches/Huésped\n`;
      this.seriesComparativaFiltradas().forEach((s) => {
        csv += `"${s.codigo || ''}","${s.etiqueta}",${s.ingresos},${s.permanencias},${s.total},${s.ratio_permanencia_ingreso}\n`;
      });
      csv += `\n`;
    }

    if (g4) {
      const torta = this.datosTortaCalculados();
      csv += `4. DISTRIBUCIÓN GENERAL: NACIONALES VS EXTRANJEROS (${torta.labelMetrica})\n`;
      csv += `Segmento,Cantidad,Porcentaje (%)\n`;
      csv += `"Nacionales (Bolivia)",${torta.nacionalesCant},${torta.nacionalesPct}%\n`;
      csv += `"Extranjeros",${torta.extranjerosCant},${torta.extranjerosPct}%\n`;
      csv += `"TOTAL GENERAL",${torta.total},100%\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_PDHO_${this.modoFiltroPeriodo() === 'mes' ? this.mesSeleccionado() + '_' + this.gestionSeleccionada() : 'Rango'}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.toastService.success('Reporte CSV descargado con éxito.');
    this.cerrarModalExportar();
  }

  formatearFechaCorta(fechaStr?: string | null): string {
    if (!fechaStr) return '';
    try {
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  }

  private normalizarTexto(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
