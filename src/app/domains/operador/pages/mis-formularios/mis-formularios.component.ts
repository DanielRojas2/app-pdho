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
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { EstablecimientoResponse } from '../../../../core/models/establecimiento.models';
import {
  EstadisticaHoteleraResponse,
  OcupacionHoteleraResponse,
  EstadoFormulario
} from '../../../../core/models/formulario.models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-mis-formularios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mis-formularios.component.html',
  styleUrl: './mis-formularios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisFormulariosComponent implements OnInit {
  private readonly establecimientoService = inject(EstablecimientoService);
  private readonly formulariosService = inject(FormulariosService);
  private readonly sanitizer = inject(DomSanitizer);

  // Datos base
  readonly establecimiento = signal<EstablecimientoResponse | null>(null);
  readonly estadisticas = signal<EstadisticaHoteleraResponse[]>([]);
  readonly ocupaciones = signal<OcupacionHoteleraResponse[]>([]);
  readonly cargando = signal<boolean>(true);

  // Switch de tipo de formulario ('f1' = Estadística, 'f2' = Ocupación)
  readonly tipoFormularioActivo = signal<'f1' | 'f2'>('f1');

  // Filtros
  readonly filtroGestion = signal<number | 'TODAS'>('TODAS');
  readonly busqueda = signal<string>('');

  // Paginación (10 items por página)
  readonly itemsPorPagina = 10;
  readonly paginaActual = signal<number>(1);

  // Modales
  readonly modalDetalleF1Abierto = signal<EstadisticaHoteleraResponse | null>(null);
  readonly modalDetalleF2Abierto = signal<OcupacionHoteleraResponse | null>(null);
  readonly modalRespaldoAbierto = signal<boolean>(false);
  readonly urlRespaldoActivo = signal<string | null>(null);
  readonly tipoRespaldoActivo = signal<'imagen' | 'pdf' | null>(null);
  readonly tituloRespaldoActivo = signal<string>('');

  // Lista de gestiones únicas disponibles en los datos
  readonly listaGestiones = computed<number[]>(() => {
    const gestiones = new Set<number>();
    const anioActual = new Date().getFullYear();
    gestiones.add(anioActual);
    gestiones.add(anioActual - 1);

    this.estadisticas().forEach((e) => gestiones.add(e.gestion));
    this.ocupaciones().forEach((o) => gestiones.add(o.gestion));

    return Array.from(gestiones).sort((a, b) => b - a);
  });

  // Lista de Formularios 1 ordenados de último enviado al primero y filtrados
  readonly estadisticasFiltradas = computed<EstadisticaHoteleraResponse[]>(() => {
    let items = [...this.estadisticas()];
    const gFiltro = this.filtroGestion();
    const query = this.normalizarTexto(this.busqueda());

    // Filtrar por gestión
    if (gFiltro !== 'TODAS') {
      items = items.filter((item) => item.gestion === Number(gFiltro));
    }

    // Filtrar por texto de búsqueda
    if (query) {
      items = items.filter((item) => {
        const num = this.normalizarTexto(item.numero_formulario || '');
        const mes = this.normalizarTexto(item.mes || '');
        const gest = item.gestion.toString();
        const est = this.normalizarTexto(item.estado || '');
        return num.includes(query) || mes.includes(query) || gest.includes(query) || est.includes(query);
      });
    }

    // Ordenar: de último formulario enviado al primero
    return items.sort((a, b) => {
      const timeB = new Date(b.fecha_creacion || b.fecha_presentacion).getTime() || 0;
      const timeA = new Date(a.fecha_creacion || a.fecha_presentacion).getTime() || 0;
      return timeB - timeA || b.id - a.id;
    });
  });

  // Lista de Formularios 2 ordenados de último enviado al primero y filtrados
  readonly ocupacionesFiltradas = computed<OcupacionHoteleraResponse[]>(() => {
    let items = [...this.ocupaciones()];
    const gFiltro = this.filtroGestion();
    const query = this.normalizarTexto(this.busqueda());

    // Filtrar por gestión
    if (gFiltro !== 'TODAS') {
      items = items.filter((item) => item.gestion === Number(gFiltro));
    }

    // Filtrar por texto de búsqueda
    if (query) {
      items = items.filter((item) => {
        const mes = this.normalizarTexto(item.mes || '');
        const gest = item.gestion.toString();
        const idStr = item.id.toString();
        const est = this.normalizarTexto(item.estado || '');
        return mes.includes(query) || gest.includes(query) || idStr.includes(query) || est.includes(query);
      });
    }

    // Ordenar: de último formulario enviado al primero
    return items.sort((a, b) => {
      const timeB = new Date(b.fecha_creacion || b.fecha_presentacion).getTime() || 0;
      const timeA = new Date(a.fecha_creacion || a.fecha_presentacion).getTime() || 0;
      return timeB - timeA || b.id - a.id;
    });
  });

  // Total de items según switch activo
  readonly totalItems = computed<number>(() => {
    return this.tipoFormularioActivo() === 'f1'
      ? this.estadisticasFiltradas().length
      : this.ocupacionesFiltradas().length;
  });

  // Total de páginas calculadas (10 por página)
  readonly totalPaginas = computed<number>(() => {
    return Math.ceil(this.totalItems() / this.itemsPorPagina) || 1;
  });

  // Items mostrados en la página actual para Formulario 1
  readonly itemsPaginadosF1 = computed<EstadisticaHoteleraResponse[]>(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.estadisticasFiltradas().slice(inicio, inicio + this.itemsPorPagina);
  });

  // Items mostrados en la página actual para Formulario 2
  readonly itemsPaginadosF2 = computed<OcupacionHoteleraResponse[]>(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.ocupacionesFiltradas().slice(inicio, inicio + this.itemsPorPagina);
  });

  // Rango de items mostrados
  readonly rangoDesde = computed<number>(() => {
    if (this.totalItems() === 0) return 0;
    return (this.paginaActual() - 1) * this.itemsPorPagina + 1;
  });

  readonly rangoHasta = computed<number>(() => {
    return Math.min(this.paginaActual() * this.itemsPorPagina, this.totalItems());
  });

  // Botones de páginas visibles en la barra de navegación
  readonly paginasVisibles = computed<number[]>(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const paginas: number[] = [];

    const inicio = Math.max(1, actual - 2);
    const fin = Math.min(total, actual + 2);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  });

  // URL segura para iframe en caso de PDF
  readonly urlRespaldoSegura = computed<SafeResourceUrl | null>(() => {
    const url = this.urlRespaldoActivo();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);

    // 1. Obtener establecimiento
    this.establecimientoService.getMiEstablecimiento().subscribe({
      next: (est) => this.establecimiento.set(est),
      error: (err) => console.error('Error al cargar establecimiento en mis formularios:', err)
    });

    // 2. Obtener Formularios 1 (Estadísticas Hoteleras)
    this.formulariosService.listarEstadisticas({ limit: 100 }).subscribe({
      next: (items) => {
        this.estadisticas.set(items);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar estadísticas en mis formularios:', err);
        this.cargando.set(false);
      }
    });

    // 3. Obtener Formularios 2 (Ocupación Hotelera)
    this.formulariosService.listarOcupaciones({ limit: 100 }).subscribe({
      next: (items) => this.ocupaciones.set(items),
      error: (err) => console.error('Error al cargar ocupaciones en mis formularios:', err)
    });
  }

  // Conmutador (switch) entre Formulario 1 y Formulario 2
  cambiarTipoFormulario(tipo: 'f1' | 'f2'): void {
    this.tipoFormularioActivo.set(tipo);
    this.paginaActual.set(1);
  }

  // Navegación de páginas
  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cambiarFiltroGestion(g: any): void {
    this.filtroGestion.set(g === 'TODAS' ? 'TODAS' : Number(g));
    this.paginaActual.set(1);
  }

  cambiarBusqueda(val: string): void {
    this.busqueda.set(val);
    this.paginaActual.set(1);
  }

  // Modales
  abrirModalDetalleF1(item: EstadisticaHoteleraResponse): void {
    this.modalDetalleF1Abierto.set(item);
  }

  abrirModalDetalleF2(item: OcupacionHoteleraResponse): void {
    this.modalDetalleF2Abierto.set(item);
  }

  abrirModalRespaldo(fotoUrl?: string | null, pdfUrl?: string | null, titulo?: string): void {
    const rawUrl = fotoUrl || pdfUrl;
    if (!rawUrl) return;

    const fullUrl = this.obtenerUrlCompleta(rawUrl);
    const esPdf = rawUrl.toLowerCase().endsWith('.pdf') || Boolean(pdfUrl && !fotoUrl);

    this.urlRespaldoActivo.set(fullUrl);
    this.tipoRespaldoActivo.set(esPdf ? 'pdf' : 'imagen');
    this.tituloRespaldoActivo.set(titulo || 'Respaldo Físico Digitalizado');
    this.modalRespaldoAbierto.set(true);
  }

  cerrarModales(): void {
    this.modalDetalleF1Abierto.set(null);
    this.modalDetalleF2Abierto.set(null);
    this.modalRespaldoAbierto.set(false);
    this.urlRespaldoActivo.set(null);
    this.tipoRespaldoActivo.set(null);
  }

  // Helpers de formato
  obtenerUrlCompleta(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const apiBase = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiBase}${cleanPath}`;
  }

  formatearFecha(fechaStr?: string | null): string {
    if (!fechaStr) return '-';
    try {
      const partes = fechaStr.split('T')[0].split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return fechaStr;
    } catch {
      return fechaStr;
    }
  }

  getHoraAmigable(fechaIso?: string | null): string {
    if (!fechaIso || !fechaIso.includes('T')) return '';
    try {
      const horaParte = fechaIso.split('T')[1]?.split('.')[0]?.slice(0, 5);
      return horaParte ? `a las ${horaParte}` : '';
    } catch {
      return '';
    }
  }

  formatCategoria(valor?: string | null): string {
    if (!valor) return 'Sin categoría';
    return valor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getClaseEstado(estado?: EstadoFormulario | string | null): string {
    switch (estado?.toUpperCase()) {
      case 'ENVIADO':
        return 'chip-estado-enviado';
      case 'BORRADOR':
        return 'chip-estado-borrador';
      case 'APROBADO':
        return 'chip-estado-aprobado';
      case 'OBSERVADO':
        return 'chip-estado-observado';
      default:
        return 'chip-estado-enviado';
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
