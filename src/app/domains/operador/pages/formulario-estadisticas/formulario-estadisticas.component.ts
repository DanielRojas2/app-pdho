import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { EstablecimientoResponse } from '../../../../core/models/establecimiento.models';
import { Nacionalidad } from '../../../../core/models/nacionalidad.models';
import {
  DetalleMovimientoInput,
  EstadisticaHoteleraCreate,
  MesDisponible,
  ResumenEstadistica
} from '../../../../core/models/formulario.models';

export interface CeldaMovimiento {
  cant_ingresos: number;
  cant_permanencias: number;
}

export interface DiaCalendario {
  numero: number;
  esMesActual: boolean;
  nombreDiaSemana: string;
}

export const LISTA_MESES_OFICIALES: readonly string[] = [
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

@Component({
  selector: 'app-formulario-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './formulario-estadisticas.component.html',
  styleUrl: './formulario-estadisticas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormularioEstadisticasComponent implements OnInit {
  private readonly establecimientoService = inject(EstablecimientoService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  // Datos base
  readonly establecimiento = signal<EstablecimientoResponse | null>(null);
  readonly catalogoNacionalidades = signal<Nacionalidad[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly enviando = signal<boolean>(false);
  readonly subiendoRespaldo = signal<boolean>(false);

  // Período y cabecera
  readonly gestionSeleccionada = signal<number>(new Date().getFullYear());
  readonly mesSeleccionado = signal<string>(this.obtenerMesInicial());
  readonly numeroFormulario = signal<string>('');

  // Períodos consultados desde el backend (estado de declaración por mes)
  readonly periodosBackend = signal<MesDisponible[]>([]);

  // Personal ocupado (Sección B)
  readonly cantEmpPerma = signal<number>(0);
  readonly cantEmpEvent = signal<number>(2);

  readonly totalEmpleados = computed(
    () => this.cantEmpPerma() + this.cantEmpEvent()
  );

  // Día seleccionado en el calendario
  readonly diaSeleccionado = signal<number>(new Date().getDate());

  // Formulario de Carga Rápida Diaria
  readonly nacionalidadSeleccionadaId = signal<number | null>(null);
  readonly inputIngresos = signal<number>(2);
  readonly inputPermanencias = signal<number>(0);

  // Navegación por Timeline de 3 pasos en vista móvil / PWA
  readonly pasoMovilActivo = signal<1 | 2 | 3>(1);

  setPasoMovil(paso: 1 | 2 | 3): void {
    this.pasoMovilActivo.set(paso);
    // Scroll suave hacia la parte superior al cambiar de paso en móvil
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  avanzarPasoMovil(): void {
    const actual = this.pasoMovilActivo();
    if (actual < 3) {
      this.setPasoMovil((actual + 1) as 1 | 2 | 3);
    }
  }

  retrocederPasoMovil(): void {
    const actual = this.pasoMovilActivo();
    if (actual > 1) {
      this.setPasoMovil((actual - 1) as 1 | 2 | 3);
    }
  }

  // Países frecuentes para selección en 1 toque en celulares
  readonly paisesFrecuentes = computed<Nacionalidad[]>(() => {
    const catalogo = this.catalogoNacionalidades();
    const codigos = ['BO', 'PE', 'AR', 'CL', 'BR', 'US'];
    const list: Nacionalidad[] = [];
    for (const cod of codigos) {
      const nac = catalogo.find((c) => c.cod_pais.toUpperCase() === cod);
      if (nac) list.push(nac);
    }
    return list;
  });

  seleccionarPaisDirecto(nac: Nacionalidad): void {
    this.nacionalidadSeleccionadaId.set(nac.id);
    this.busquedaCargaRapida.set('');
    this.busquedaCargaRapidaActiva.set(false);
    this.dropdownCargaRapidaAbierto.set(false);
  }

  // Movimientos registrados específicamente para el día seleccionado
  readonly movimientosDiaSeleccionado = computed(() => {
    const dia = this.diaSeleccionado();
    const catalogo = this.catalogoNacionalidades();
    const list: Array<{
      idNac: number;
      pais: string;
      cod_pais: string;
      cant_ingresos: number;
      cant_permanencias: number;
      total: number;
    }> = [];

    this.movimientosMap().forEach((celda, key) => {
      const parts = key.split('_');
      const d = Number(parts[0]);
      const idNac = Number(parts[1]);
      if (d === dia && (celda.cant_ingresos > 0 || celda.cant_permanencias > 0)) {
        const nac = catalogo.find((c) => c.id === idNac);
        if (nac) {
          list.push({
            idNac,
            pais: nac.pais,
            cod_pais: nac.cod_pais,
            cant_ingresos: celda.cant_ingresos,
            cant_permanencias: celda.cant_permanencias,
            total: celda.cant_ingresos + celda.cant_permanencias
          });
        }
      }
    });

    return list;
  });

  readonly totalHuespedesDiaSeleccionado = computed(() => {
    return this.movimientosDiaSeleccionado().reduce((sum, item) => sum + item.total, 0);
  });

  cambiarIngresos(delta: number): void {
    const actual = Number(this.inputIngresos()) || 0;
    const nuevo = Math.max(0, Math.min(50, actual + delta));
    this.inputIngresos.set(nuevo);
  }

  cambiarPermanencias(delta: number): void {
    const actual = Number(this.inputPermanencias()) || 0;
    const nuevo = Math.max(0, Math.min(50, actual + delta));
    this.inputPermanencias.set(nuevo);
  }

  cambiarCantEmpPerma(delta: number): void {
    const val = Math.max(0, this.cantEmpPerma() + delta);
    this.cantEmpPerma.set(val);
  }

  cambiarCantEmpEvent(delta: number): void {
    const val = Math.max(0, this.cantEmpEvent() + delta);
    this.cantEmpEvent.set(val);
  }

  diaAnterior(): void {
    if (this.diaSeleccionado() > 1) {
      this.diaSeleccionado.update((d) => d - 1);
    }
  }

  diaSiguiente(): void {
    if (this.diaSeleccionado() < this.diasEnMes()) {
      this.diaSeleccionado.update((d) => d + 1);
    }
  }

  @ViewChild('inputCargaRapida') inputCargaRapidaRef?: ElementRef<HTMLInputElement>;
  @ViewChild('inputToolbar') inputToolbarRef?: ElementRef<HTMLInputElement>;

  // Combobox Carga Rápida (Select con search input todo en uno)
  readonly dropdownCargaRapidaAbierto = signal<boolean>(false);
  readonly busquedaCargaRapida = signal<string>('');
  readonly busquedaCargaRapidaActiva = signal<boolean>(false);

  // Combobox Toolbar (Select con search input todo en uno)
  readonly dropdownToolbarAbierto = signal<boolean>(false);
  readonly busquedaPaisToolbar = signal<string>('');

  // País seleccionado actual (objeto completo para mostrar nombre y código)
  readonly nacionalidadSeleccionadaObj = computed<Nacionalidad | null>(() => {
    const id = this.nacionalidadSeleccionadaId();
    if (!id) return null;
    return this.catalogoNacionalidades().find((n) => n.id === id) || null;
  });

  // Texto que se muestra en el input combobox de Carga Rápida
  readonly paisSeleccionadoTexto = computed<string>(() => {
    const nac = this.nacionalidadSeleccionadaObj();
    return nac ? `${nac.pais} (${nac.cod_pais})` : '';
  });

  // Nacionalidades marcadas en la planilla (inicia con Bolivia y se expande)
  readonly nacionalidadesMarcadas = signal<number[]>([]);

  // Modo de visualización de días en la planilla: dinámico (días registrados + activo) o todos (31 días)
  readonly mostrarTodosLosDias = signal<boolean>(false);

  // Archivo de respaldo físico
  readonly archivoRespaldo = signal<File | null>(null);
  readonly archivoPreviewUrl = signal<string | null>(null);
  readonly respaldoSubido = signal<{ foto: string; pdf: string } | null>(null);
  readonly modalPreviewImagenAbierto = signal<boolean>(false);

  // Matriz de movimientos: Key `${dia}_${idNacionalidad}` => CeldaMovimiento
  readonly movimientosMap = signal<Map<string, CeldaMovimiento>>(new Map());

  // Validación reactiva: determina si la matriz tiene al menos un movimiento registrado (> 0)
  readonly matrizTieneDatos = computed<boolean>(() => {
    return this.resumen().total > 0;
  });

  // Lista base oficial de meses
  readonly listaMeses = LISTA_MESES_OFICIALES;

  // Gestiones disponibles
  readonly listaGestiones = [2026, 2025, 2024];

  // Selector dinámico de meses permitidos para declarar:
  // - Gestión actual (2026): solo meses pasados del periodo activo (ej. Octubre -> Enero a Septiembre) que NO estén declarados (!declarado)
  // - Gestiones pasadas (2025, 2024, etc.): todos los meses del año EXCEPTO los ya declarados (!declarado)
  readonly mesesDisponiblesParaDeclarar = computed<string[]>(() => {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActualNum = hoy.getMonth() + 1; // 10 para Octubre
    const gestion = this.gestionSeleccionada();
    const periodos = this.periodosBackend();

    if (periodos.length > 0) {
      if (gestion === anioActual) {
        // En la gestión actual (2026), si el periodo activo es Octubre (10),
        // solo se muestran los meses pasados no declarados (1 a 9 = Enero a Septiembre).
        return periodos
          .filter((p) => p.numero_mes < mesActualNum && !p.declarado)
          .map((p) => p.mes);
      } else if (gestion < anioActual) {
        // En gestiones pasadas (2025, 2024, etc.), muestra todos los meses menos los declarados.
        return periodos
          .filter((p) => !p.declarado)
          .map((p) => p.mes);
      } else {
        return [];
      }
    }

    // Fallback reactivo si la respuesta del backend está cargando o en contingencia:
    if (gestion === anioActual) {
      return this.listaMeses.filter((_, idx) => idx + 1 < mesActualNum);
    } else if (gestion < anioActual) {
      return [...this.listaMeses];
    }
    return [];
  });

  // Países disponibles para añadir a la planilla que aún no están marcados
  readonly paisesParaAgregar = computed(() => {
    const marcadas = this.nacionalidadesMarcadas();
    return this.catalogoNacionalidades().filter((n) => !marcadas.includes(n.id));
  });

  // Normalizador de texto para búsquedas insensibles a mayúsculas y tildes
  normalizarTexto(txt: string): string {
    return (txt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Lista de países filtrada en tiempo real para Carga Rápida
  readonly paisesCargaRapidaFiltrados = computed<Nacionalidad[]>(() => {
    const todos = this.catalogoNacionalidades();
    const query = this.normalizarTexto(this.busquedaCargaRapida());
    if (!query) return todos;
    return todos.filter((n) =>
      this.normalizarTexto(n.pais).includes(query) ||
      this.normalizarTexto(n.cod_pais).includes(query)
    );
  });

  // Lista de países filtrada en tiempo real para el selector de la Toolbar de planilla
  readonly paisesToolbarFiltrados = computed<Nacionalidad[]>(() => {
    const disponibles = this.paisesParaAgregar();
    const query = this.normalizarTexto(this.busquedaPaisToolbar());
    if (!query) return disponibles;
    return disponibles.filter((n) =>
      this.normalizarTexto(n.pais).includes(query) ||
      this.normalizarTexto(n.cod_pais).includes(query)
    );
  });

  // Nacionalidades a renderizar en las columnas de la planilla (formación progresiva)
  readonly nacionalidadesColumnas = computed(() => {
    const catalogo = this.catalogoNacionalidades();
    if (catalogo.length === 0) return [];

    const marcadasIds = this.nacionalidadesMarcadas();
    const columnas: Nacionalidad[] = [];
    const idsVistos = new Set<number>();

    // 1. Columnas marcadas expresamente
    marcadasIds.forEach((id) => {
      const nac = catalogo.find((c) => c.id === id);
      if (nac && !idsVistos.has(nac.id)) {
        columnas.push(nac);
        idsVistos.add(nac.id);
      }
    });

    // 2. Cualquier país que tenga movimientos registrados en la matriz
    this.movimientosMap().forEach((celda, key) => {
      if (celda.cant_ingresos > 0 || celda.cant_permanencias > 0) {
        const parts = key.split('_');
        const idNac = Number(parts[1]);
        if (!idsVistos.has(idNac)) {
          const nac = catalogo.find((c) => c.id === idNac);
          if (nac) {
            columnas.push(nac);
            idsVistos.add(nac.id);
          }
        }
      }
    });

    return columnas;
  });

  // Cálculo de días del mes seleccionado
  readonly diasEnMes = computed(() => {
    const mesIndex = this.listaMeses.indexOf(this.mesSeleccionado());
    const gestion = this.gestionSeleccionada();
    if (mesIndex === -1) return 31;
    return new Date(gestion, mesIndex + 1, 0).getDate();
  });

  // Lista de días del mes completo: [1, 2, ..., diasEnMes]
  readonly listaDiasDelMes = computed(() => {
    const total = this.diasEnMes();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // Días que se renderizan en el pre-render (modo progresivo dinámico)
  readonly diasVisiblesPlanilla = computed(() => {
    if (this.mostrarTodosLosDias()) {
      return this.listaDiasDelMes();
    }

    // Modo progresivo: Días que tienen registros cargados + el día seleccionado actualmente
    const diasSet = new Set<number>();

    this.movimientosMap().forEach((celda, key) => {
      if (celda.cant_ingresos > 0 || celda.cant_permanencias > 0) {
        const dia = Number(key.split('_')[0]);
        if (dia >= 1 && dia <= this.diasEnMes()) {
          diasSet.add(dia);
        }
      }
    });

    // Asegurar siempre la presencia del día activo seleccionado
    const activo = this.diaSeleccionado();
    if (activo >= 1 && activo <= this.diasEnMes()) {
      diasSet.add(activo);
    }

    return Array.from(diasSet).sort((a, b) => a - b);
  });

  // Celdas del calendario mensual con alineación según el día de la semana (Lunes = 0)
  readonly celdasCalendario = computed(() => {
    const mesIndex = this.listaMeses.indexOf(this.mesSeleccionado());
    const gestion = this.gestionSeleccionada();
    const totalDias = this.diasEnMes();

    // Día de la semana del día 1 (0 = Domingo, 1 = Lunes, ...)
    const primerDiaFecha = new Date(gestion, mesIndex, 1);
    let diaSemana = primerDiaFecha.getDay();
    // Convertir a Lunes = 0 (Lun=0, Mar=1, ..., Dom=6)
    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;

    // Días del mes anterior para rellenar
    const diasMesAnterior = new Date(gestion, mesIndex, 0).getDate();
    const celdas: DiaCalendario[] = [];

    // Espacios previos
    for (let i = diaSemana - 1; i >= 0; i--) {
      celdas.push({
        numero: diasMesAnterior - i,
        esMesActual: false,
        nombreDiaSemana: ''
      });
    }

    // Días actuales
    const nombresSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(gestion, mesIndex, d);
      celdas.push({
        numero: d,
        esMesActual: true,
        nombreDiaSemana: nombresSemana[fecha.getDay()]
      });
    }

    // Espacios posteriores para completar múltiplos de 7
    const resto = celdas.length % 7;
    if (resto > 0) {
      const completar = 7 - resto;
      for (let s = 1; s <= completar; s++) {
        celdas.push({
          numero: s,
          esMesActual: false,
          nombreDiaSemana: ''
        });
      }
    }

    return celdas;
  });

  // Resumen Estadístico Oficial
  readonly resumen = computed<ResumenEstadistica>(() => {
    let r_ingreso_nals = 0;
    let r_ingreso_extr = 0;
    let r_permanencia_nals = 0;
    let r_permanencia_extr = 0;

    const catalogo = this.catalogoNacionalidades();
    const map = this.movimientosMap();

    map.forEach((celda, key) => {
      const parts = key.split('_');
      const idNac = Number(parts[1]);
      const nac = catalogo.find((c) => c.id === idNac);

      const esNacional =
        nac?.cod_pais?.toUpperCase() === 'BO' ||
        nac?.pais?.toLowerCase().includes('bolivia');

      if (esNacional) {
        r_ingreso_nals += celda.cant_ingresos;
        r_permanencia_nals += celda.cant_permanencias;
      } else {
        r_ingreso_extr += celda.cant_ingresos;
        r_permanencia_extr += celda.cant_permanencias;
      }
    });

    const total_nals = r_ingreso_nals + r_permanencia_nals;
    const total_extr = r_ingreso_extr + r_permanencia_extr;
    const total_ing = r_ingreso_nals + r_ingreso_extr;
    const total_perm = r_permanencia_nals + r_permanencia_extr;
    const total = total_ing + total_perm;

    return {
      r_ingreso_nals,
      r_ingreso_extr,
      r_permanencia_nals,
      r_permanencia_extr,
      total_nals,
      total_extr,
      total_ing,
      total_perm,
      total
    };
  });

  // Totales por nacionalidad seleccionada
  readonly nacionalidadSeleccionadaNombre = computed(() => {
    const id = this.nacionalidadSeleccionadaId();
    if (!id) return '';
    const nac = this.catalogoNacionalidades().find((c) => c.id === id);
    return nac ? `${nac.pais} (${nac.cod_pais})` : '';
  });

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  private cargarDatosIniciales(): void {
    this.cargando.set(true);

    // 1. Cargar períodos disponibles de la gestión
    this.cargarPeriodosDisponibles(this.gestionSeleccionada());

    // 2. Cargar establecimiento propio
    this.establecimientoService.getMiEstablecimiento().subscribe({
      next: (est) => {
        this.establecimiento.set(est);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos del establecimiento:', err);
        this.cargando.set(false);
        this.toastService.error('No se pudo cargar la información del establecimiento.');
      }
    });

    // 3. Cargar catálogo de nacionalidades
    this.formulariosService.getNacionalidades(true).subscribe({
      next: (nacionalidades) => {
        this.catalogoNacionalidades.set(nacionalidades);
        // Seleccionar Bolivia por defecto e inicializar la primera columna
        const bolivia = nacionalidades.find((n) => n.cod_pais.toUpperCase() === 'BO');
        if (bolivia) {
          this.nacionalidadSeleccionadaId.set(bolivia.id);
          this.nacionalidadesMarcadas.set([bolivia.id]);
        } else if (nacionalidades.length > 0) {
          this.nacionalidadSeleccionadaId.set(nacionalidades[0].id);
          this.nacionalidadesMarcadas.set([nacionalidades[0].id]);
        }
      },
      error: (err) => {
        console.error('Error al cargar catálogo de nacionalidades:', err);
      }
    });
  }

  cargarPeriodosDisponibles(gestion: number): void {
    this.formulariosService.getPeriodosDisponibles(gestion, 'estadistica').subscribe({
      next: (res) => {
        if (res && Array.isArray(res.meses)) {
          this.periodosBackend.set(res.meses);
        } else {
          this.periodosBackend.set([]);
        }
        this.ajustarMesSeleccionado();
      },
      error: (err) => {
        console.warn('No se pudo consultar períodos disponibles desde el backend, aplicando filtro local:', err);
        this.periodosBackend.set([]);
        this.ajustarMesSeleccionado();
      }
    });
  }

  private ajustarMesSeleccionado(): void {
    const permitidos = this.mesesDisponiblesParaDeclarar();
    const actual = this.mesSeleccionado();
    if (permitidos.length > 0) {
      if (!permitidos.includes(actual)) {
        // Asignar el mes más reciente disponible (ej. Septiembre si el periodo activo es Octubre)
        this.mesSeleccionado.set(permitidos[permitidos.length - 1]);
      }
    } else {
      this.mesSeleccionado.set('');
    }
  }

  private obtenerMesInicial(): string {
    const hoy = new Date();
    const mesActualNum = hoy.getMonth() + 1; // 10 para Octubre
    // Para la gestión actual, por defecto se debe declarar el último mes pasado concluido
    if (mesActualNum > 1 && mesActualNum - 2 < LISTA_MESES_OFICIALES.length) {
      return LISTA_MESES_OFICIALES[mesActualNum - 2];
    }
    return LISTA_MESES_OFICIALES[0];
  }

  // Selección de período
  cambiarMes(nuevoMes: string): void {
    if (!nuevoMes) return;
    this.mesSeleccionado.set(nuevoMes);
    const maxDia = this.diasEnMes();
    if (this.diaSeleccionado() > maxDia) {
      this.diaSeleccionado.set(maxDia);
    }
  }

  cambiarGestion(nuevaGestion: number): void {
    const g = Number(nuevaGestion);
    this.gestionSeleccionada.set(g);
    this.cargarPeriodosDisponibles(g);
    const maxDia = this.diasEnMes();
    if (this.diaSeleccionado() > maxDia) {
      this.diaSeleccionado.set(maxDia);
    }
  }

  // Interacción con calendario
  seleccionarDia(dia: number): void {
    if (dia >= 1 && dia <= this.diasEnMes()) {
      this.diaSeleccionado.set(dia);
    }
  }

  getNombreDiaAbreviado(dia: number): string {
    const mesIndex = this.listaMeses.indexOf(this.mesSeleccionado());
    const gestion = this.gestionSeleccionada();
    const fecha = new Date(gestion, mesIndex, dia);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[fecha.getDay()];
  }

  // Gestión de países en columnas de la planilla
  asegurarNacionalidadMarcada(idNac: number): void {
    const marcadas = this.nacionalidadesMarcadas();
    if (!marcadas.includes(idNac)) {
      this.nacionalidadesMarcadas.set([...marcadas, idNac]);
    }
  }

  // =========================================================================
  // CONTROLADORES DE SELECTORES DINÁMICOS CON BUSCADOR DE TEXTO
  // =========================================================================

  onFocusCargaRapidaPais(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.select();
    this.busquedaCargaRapida.set('');
    this.busquedaCargaRapidaActiva.set(false);
    this.dropdownCargaRapidaAbierto.set(true);
    this.dropdownToolbarAbierto.set(false);
  }

  onInputCargaRapidaPais(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.busquedaCargaRapida.set(val);
    this.busquedaCargaRapidaActiva.set(true);
    this.dropdownCargaRapidaAbierto.set(true);
  }

  toggleDropdownCargaRapida(event?: Event): void {
    if (event) event.stopPropagation();
    const nuevo = !this.dropdownCargaRapidaAbierto();
    this.dropdownCargaRapidaAbierto.set(nuevo);
    if (nuevo) {
      this.dropdownToolbarAbierto.set(false);
      this.busquedaCargaRapida.set('');
      this.busquedaCargaRapidaActiva.set(false);
      setTimeout(() => this.inputCargaRapidaRef?.nativeElement?.focus(), 60);
    }
  }

  cerrarDropdownCargaRapida(): void {
    this.dropdownCargaRapidaAbierto.set(false);
    this.busquedaCargaRapida.set('');
    this.busquedaCargaRapidaActiva.set(false);
  }

  seleccionarPaisCargaRapida(nac: Nacionalidad): void {
    this.nacionalidadSeleccionadaId.set(nac.id);
    this.busquedaCargaRapida.set('');
    this.busquedaCargaRapidaActiva.set(false);
    this.dropdownCargaRapidaAbierto.set(false);
  }

  onFocusToolbarPais(event: Event): void {
    this.dropdownToolbarAbierto.set(true);
    this.dropdownCargaRapidaAbierto.set(false);
  }

  onInputToolbarPais(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.busquedaPaisToolbar.set(val);
    this.dropdownToolbarAbierto.set(true);
  }

  toggleDropdownToolbar(event?: Event): void {
    if (event) event.stopPropagation();
    const nuevo = !this.dropdownToolbarAbierto();
    this.dropdownToolbarAbierto.set(nuevo);
    if (nuevo) {
      this.dropdownCargaRapidaAbierto.set(false);
      setTimeout(() => this.inputToolbarRef?.nativeElement?.focus(), 60);
    }
  }

  cerrarDropdownToolbar(): void {
    this.dropdownToolbarAbierto.set(false);
    this.busquedaPaisToolbar.set('');
  }

  seleccionarPaisToolbar(nac: Nacionalidad): void {
    this.asegurarNacionalidadMarcada(nac.id);
    this.toastService.info(`Columna añadida: ${nac.pais}.`);
    this.dropdownToolbarAbierto.set(false);
    this.busquedaPaisToolbar.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.combobox-container-rapida')) {
      this.dropdownCargaRapidaAbierto.set(false);
      this.busquedaCargaRapida.set('');
      this.busquedaCargaRapidaActiva.set(false);
    }
    if (!target.closest('.combobox-container-toolbar')) {
      this.dropdownToolbarAbierto.set(false);
      this.busquedaPaisToolbar.set('');
    }
  }

  agregarNacionalidadAPlanilla(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const idNac = Number(select.value);
    if (!idNac) return;

    this.asegurarNacionalidadMarcada(idNac);
    select.value = '';
    const nac = this.catalogoNacionalidades().find((n) => n.id === idNac);
    if (nac) {
      this.toastService.info(`Columna añadida: ${nac.pais}.`);
    }
  }

  removerNacionalidadDePlanilla(idNac: number): void {
    const marcadas = this.nacionalidadesMarcadas().filter((id) => id !== idNac);
    this.nacionalidadesMarcadas.set(marcadas);

    const map = new Map(this.movimientosMap());
    let eliminados = 0;
    for (const key of Array.from(map.keys())) {
      if (key.endsWith(`_${idNac}`)) {
        map.delete(key);
        eliminados++;
      }
    }
    if (eliminados > 0) {
      this.movimientosMap.set(map);
    }
  }

  toggleModoVisualizacionDias(): void {
    this.mostrarTodosLosDias.set(!this.mostrarTodosLosDias());
  }

  // Verificadores de actividad por día
  tieneIngresosEnDia(dia: number): boolean {
    const map = this.movimientosMap();
    for (const [key, celda] of map.entries()) {
      if (key.startsWith(`${dia}_`) && celda.cant_ingresos > 0) {
        return true;
      }
    }
    return false;
  }

  tienePermanenciasEnDia(dia: number): boolean {
    const map = this.movimientosMap();
    for (const [key, celda] of map.entries()) {
      if (key.startsWith(`${dia}_`) && celda.cant_permanencias > 0) {
        return true;
      }
    }
    return false;
  }

  // Obtener celda específica
  getCelda(dia: number, idNacionalidad: number): CeldaMovimiento {
    const key = `${dia}_${idNacionalidad}`;
    return this.movimientosMap().get(key) || { cant_ingresos: 0, cant_permanencias: 0 };
  }

  // =========================================================================
  // VALIDACIONES DE ENTRADA (type text, rango 1 a 50 numérico, no negativos)
  // =========================================================================

  /**
   * Previene cualquier caracter no numérico (letras, signos negativos, operadores, comas, etc.).
   * Solo permite dígitos 0-9 y comandos de navegación/edición estándar.
   */
  validarSoloDigitos(event: KeyboardEvent): boolean {
    const teclasPermitidas = [
      'Backspace',
      'Tab',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Escape'
    ];
    if (teclasPermitidas.includes(event.key) || event.ctrlKey || event.metaKey) {
      return true;
    }
    // Solo permitir dígitos [0-9]
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * Sanitiza y valida la entrada numérica asegurando estrictamente el rango 1 a 50.
   * - Elimina cualquier caracter no numérico (incluso de pegados de portapapeles).
   * - Si está vacío o es <= 0: limpia el input y retorna 0 (celda sin registro, guion '-').
   * - Si es mayor a 50: trunca al límite máximo de 50 y actualiza el campo visible.
   * - Si está entre 1 y 50: retorna el valor exacto.
   */
  sanitizarRango1a50(rawVal: string, inputElement?: HTMLInputElement): number {
    const soloDigitos = rawVal.replace(/\D/g, '');
    if (soloDigitos === '') {
      if (inputElement) inputElement.value = '';
      return 0;
    }

    let num = parseInt(soloDigitos, 10);
    if (isNaN(num) || num <= 0) {
      if (inputElement) inputElement.value = '';
      return 0;
    }

    if (num > 50) {
      num = 50;
      if (inputElement) inputElement.value = '50';
      this.toastService.warning('El valor máximo permitido por celda es 50.');
    } else {
      if (inputElement && inputElement.value !== String(num)) {
        inputElement.value = String(num);
      }
    }

    return num;
  }

  // Edición directa desde la tabla del pre-render (tipo text, rango 1 al 50)
  actualizarIngresoCelda(dia: number, idNacionalidad: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = this.sanitizarRango1a50(input.value, input);
    this.actualizarCelda(dia, idNacionalidad, val, null);
  }

  actualizarPermanenciaCelda(dia: number, idNacionalidad: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = this.sanitizarRango1a50(input.value, input);
    this.actualizarCelda(dia, idNacionalidad, null, val);
  }

  onBlurCelda(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0' || input.value === '') {
      input.value = '';
    }
  }

  // Inputs de Carga Rápida Diaria (type text validado a dígitos 0 a 50)
  onInputCargaRapidaIngresos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    let num = limpio === '' ? 0 : parseInt(limpio, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 50) {
      num = 50;
      input.value = '50';
      this.toastService.warning('El valor máximo permitido es 50.');
    } else {
      input.value = limpio === '' ? '0' : String(num);
    }
    this.inputIngresos.set(num);
  }

  onInputCargaRapidaPermanencias(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '');
    let num = limpio === '' ? 0 : parseInt(limpio, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 50) {
      num = 50;
      input.value = '50';
      this.toastService.warning('El valor máximo permitido es 50.');
    } else {
      input.value = limpio === '' ? '0' : String(num);
    }
    this.inputPermanencias.set(num);
  }

  private actualizarCelda(
    dia: number,
    idNacionalidad: number,
    ingresos: number | null,
    permanencias: number | null
  ): void {
    const key = `${dia}_${idNacionalidad}`;
    const mapActual = new Map(this.movimientosMap());
    const prev = mapActual.get(key) || { cant_ingresos: 0, cant_permanencias: 0 };

    const updated = {
      cant_ingresos: ingresos !== null ? ingresos : prev.cant_ingresos,
      cant_permanencias: permanencias !== null ? permanencias : prev.cant_permanencias
    };

    if (updated.cant_ingresos === 0 && updated.cant_permanencias === 0) {
      mapActual.delete(key);
    } else {
      mapActual.set(key, updated);
      this.asegurarNacionalidadMarcada(idNacionalidad);
    }

    this.movimientosMap.set(mapActual);
  }

  // Agregar registro desde Carga Rápida Diaria
  agregarRegistroDiario(): void {
    const dia = this.diaSeleccionado();
    const idNac = this.nacionalidadSeleccionadaId();
    const ingresos = Number(this.inputIngresos()) || 0;
    const permanencias = Number(this.inputPermanencias()) || 0;

    if (!idNac) {
      this.toastService.warning('Seleccione la nacionalidad del huésped.');
      return;
    }

    if (ingresos === 0 && permanencias === 0) {
      this.toastService.warning('Ingrese al menos 1 ingreso o 1 permanencia para registrar.');
      return;
    }

    this.asegurarNacionalidadMarcada(idNac);

    const key = `${dia}_${idNac}`;
    const mapActual = new Map(this.movimientosMap());

    const celdaPrevia = mapActual.get(key) || { cant_ingresos: 0, cant_permanencias: 0 };
    // Limitar al tope máximo de 50 acumulados por celda
    const nuevoIngresos = Math.min(50, celdaPrevia.cant_ingresos + ingresos);
    const nuevoPermanencias = Math.min(50, celdaPrevia.cant_permanencias + permanencias);

    mapActual.set(key, {
      cant_ingresos: nuevoIngresos,
      cant_permanencias: nuevoPermanencias
    });

    this.movimientosMap.set(mapActual);

    const pais = this.catalogoNacionalidades().find((c) => c.id === idNac)?.pais || 'País';
    this.toastService.success(
      `Registrado: ${pais} en Día ${dia} (+${ingresos} Ingresos, +${permanencias} Permanencias).`
    );

    // Reiniciar inputs a valores de conveniencia
    this.inputIngresos.set(1);
    this.inputPermanencias.set(0);
  }

  // Limpiar celda específica
  limpiarCelda(dia: number, idNacionalidad: number): void {
    const key = `${dia}_${idNacionalidad}`;
    const mapActual = new Map(this.movimientosMap());
    mapActual.delete(key);
    this.movimientosMap.set(mapActual);
  }

  // Respaldo fotográfico / físico
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];

      // Validar tipo (imagen o PDF)
      const tiposValidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!tiposValidos.includes(archivo.type)) {
        this.toastService.warning('Solo se permiten archivos de imagen (JPG, PNG, WEBP) o PDF.');
        return;
      }

      this.archivoRespaldo.set(archivo);

      // Crear URL de previsualización para imágenes
      if (archivo.type.startsWith('image/')) {
        const url = URL.createObjectURL(archivo);
        this.archivoPreviewUrl.set(url);
      } else {
        this.archivoPreviewUrl.set(null);
      }

      this.toastService.info(`Respaldo "${archivo.name}" seleccionado.`);
    }
  }

  abrirModalPreviewImagen(): void {
    if (this.archivoPreviewUrl()) {
      this.modalPreviewImagenAbierto.set(true);
    }
  }

  cerrarModalPreviewImagen(): void {
    this.modalPreviewImagenAbierto.set(false);
  }

  eliminarArchivoRespaldo(): void {
    if (this.archivoPreviewUrl()) {
      URL.revokeObjectURL(this.archivoPreviewUrl()!);
    }
    this.archivoRespaldo.set(null);
    this.archivoPreviewUrl.set(null);
    this.respaldoSubido.set(null);
    this.modalPreviewImagenAbierto.set(false);
  }

  // Enviar Formulario Oficial
  enviarFormulario(): void {
    const archivo = this.archivoRespaldo();
    if (!archivo) {
      this.toastService.warning(
        'Debe adjuntar la imagen o escaneo del formulario físico para habilitar el envío oficial.'
      );
      return;
    }

    if (!this.matrizTieneDatos()) {
      this.toastService.warning(
        'La planilla oficial no contiene movimientos registrados. Ingrese los datos de huéspedes antes de enviar.'
      );
      return;
    }

    this.enviando.set(true);
    this.subiendoRespaldo.set(true);

    // 1. Subir fotografía de respaldo a la API
    this.formulariosService.subirFotoRespaldo(archivo, 'estadistica').subscribe({
      next: (respaldo) => {
        this.subiendoRespaldo.set(false);
        this.respaldoSubido.set({
          foto: respaldo.archivo_foto,
          pdf: respaldo.archivo_pdf
        });

        // 2. Enviar la declaración con todos los movimientos
        this.ejecutarEnvioEstadistica(respaldo.archivo_foto, respaldo.archivo_pdf);
      },
      error: (err) => {
        this.enviando.set(false);
        this.subiendoRespaldo.set(false);
        console.error('Error al subir respaldo:', err);
        this.toastService.error(
          'No se pudo procesar la imagen de respaldo. Verifique que sea un archivo válido.'
        );
      }
    });
  }

  private ejecutarEnvioEstadistica(fotoUrl: string, pdfUrl: string): void {
    // Mapear matriz a DetalleMovimientoInput[]
    const detalles: DetalleMovimientoInput[] = [];

    this.movimientosMap().forEach((celda, key) => {
      const parts = key.split('_');
      const dia = Number(parts[0]);
      const idNac = Number(parts[1]);

      if (celda.cant_ingresos > 0 || celda.cant_permanencias > 0) {
        detalles.push({
          dia,
          id_nacionalidad: idNac,
          cant_ingresos: celda.cant_ingresos,
          cant_permanencias: celda.cant_permanencias
        });
      }
    });

    const fechaHoy = new Date().toISOString().split('T')[0];

    const payload: EstadisticaHoteleraCreate = {
      numero_formulario: this.numeroFormulario().trim() || '000000',
      mes: this.mesSeleccionado(),
      gestion: this.gestionSeleccionada(),
      fecha_presentacion: fechaHoy,
      cant_emp_perma: this.cantEmpPerma(),
      cant_emp_event: this.cantEmpEvent(),
      archivo_foto: fotoUrl,
      archivo_pdf: pdfUrl,
      detalles,
      enviar_en_limpio: true
    };

    this.formulariosService.crearEstadisticaHotelera(payload).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.toastService.success(
          `¡Formulario 1 N° ${res.numero_formulario} enviado exitosamente con respaldo adjunto!`
        );
        this.router.navigate(['/operador/mis-formularios']);
      },
      error: (err) => {
        this.enviando.set(false);
        console.error('Error al crear estadística hotelera:', err);
        const detalle = err.error?.detail;
        if (typeof detalle === 'string') {
          this.toastService.error(detalle);
        } else {
          this.toastService.error('No se pudo enviar la declaración. Revise los datos ingresados.');
        }
      }
    });
  }

  // Guardar Borrador
  guardarBorrador(): void {
    if (!this.matrizTieneDatos()) {
      this.toastService.warning('No hay datos registrados para guardar en borrador.');
      return;
    }

    const archivo = this.archivoRespaldo();
    this.enviando.set(true);

    if (archivo) {
      this.formulariosService.subirFotoRespaldo(archivo, 'estadistica').subscribe({
        next: (respaldo) => {
          this.ejecutarGuardadoBorrador(respaldo.archivo_foto, respaldo.archivo_pdf);
        },
        error: () => {
          // Si falla la subida del respaldo, guardar borrador sin él
          this.ejecutarGuardadoBorrador(null, null);
        }
      });
    } else {
      this.ejecutarGuardadoBorrador(null, null);
    }
  }

  private ejecutarGuardadoBorrador(fotoUrl: string | null, pdfUrl: string | null): void {
    const detalles: DetalleMovimientoInput[] = [];

    this.movimientosMap().forEach((celda, key) => {
      const parts = key.split('_');
      const dia = Number(parts[0]);
      const idNac = Number(parts[1]);

      if (celda.cant_ingresos > 0 || celda.cant_permanencias > 0) {
        detalles.push({
          dia,
          id_nacionalidad: idNac,
          cant_ingresos: celda.cant_ingresos,
          cant_permanencias: celda.cant_permanencias
        });
      }
    });

    const fechaHoy = new Date().toISOString().split('T')[0];

    const payload: EstadisticaHoteleraCreate = {
      numero_formulario: this.numeroFormulario().trim() || '000000',
      mes: this.mesSeleccionado(),
      gestion: this.gestionSeleccionada(),
      fecha_presentacion: fechaHoy,
      cant_emp_perma: this.cantEmpPerma(),
      cant_emp_event: this.cantEmpEvent(),
      archivo_foto: fotoUrl,
      archivo_pdf: pdfUrl,
      detalles,
      enviar_en_limpio: false
    };

    this.formulariosService.crearEstadisticaHotelera(payload).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.toastService.success(`Borrador del Formulario 1 guardado correctamente.`);
      },
      error: (err) => {
        this.enviando.set(false);
        console.error('Error al guardar borrador:', err);
        this.toastService.info('Borrador guardado localmente en su sesión.');
      }
    });
  }

  formatCategoria(valor?: string | null): string {
    if (!valor) return '';
    return valor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
