import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { ReportesService } from '../../../../core/services/reportes.service';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { TableroEjecutivoResponse } from '../../../../core/models/reportes.models';
import { EstadisticaHoteleraResponse } from '../../../../core/models/formulario.models';
import { ModalRevisionFormularioComponent } from '../../components/modal-revision-formulario/modal-revision-formulario.component';
import { forkJoin } from 'rxjs';

export interface KpiCardUI {
  titulo: string;
  valor: string;
  subtexto: string;
  icono: 'hotel' | 'clipboard' | 'users' | 'moon';
  color: 'carmesi' | 'emerald' | 'blue' | 'amber';
}

@Component({
  selector: 'app-admin-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalRevisionFormularioComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly reportesService = inject(ReportesService);
  private readonly formulariosService = inject(FormulariosService);

  // Estados reactivos con Signals
  readonly cargando = signal<boolean>(true);
  readonly errorCarga = signal<string | null>(null);
  readonly tablero = signal<TableroEjecutivoResponse | null>(null);
  readonly ultimosFormularios = signal<EstadisticaHoteleraResponse[]>([]);

  // Modal de revisión y aprobación
  readonly formularioParaRevisarId = signal<number | null>(null);
  readonly formularioNumeroSeleccionado = signal<string | null>(null);

  // KPIs calculados dinámicamente con datos reales del Tablero Ejecutivo
  readonly kpis = computed<KpiCardUI[]>(() => {
    const t = this.tablero();

    if (!t) {
      return [
        {
          titulo: 'Establecimientos Registrados',
          valor: '—',
          subtexto: 'Cargando datos...',
          icono: 'hotel',
          color: 'carmesi'
        },
        {
          titulo: 'Formularios Declarados (Mes Activo)',
          valor: '—',
          subtexto: 'Cargando datos...',
          icono: 'clipboard',
          color: 'emerald'
        },
        {
          titulo: 'Total Huéspedes Registrados',
          valor: '—',
          subtexto: 'Cargando datos...',
          icono: 'users',
          color: 'blue'
        },
        {
          titulo: 'Pernoctaciones Acumuladas',
          valor: '—',
          subtexto: 'Cargando datos...',
          icono: 'moon',
          color: 'amber'
        }
      ];
    }

    const reg = t.establecimientos_registrados ?? 0;
    const dec = t.establecimientos_declarantes ?? 0;
    const cob = t.porcentaje_cobertura_establecimientos ?? 0;
    const forms = t.total_formularios_declarados ?? 0;
    const huespedes = t.total_huespedes ?? 0;
    const ingresos = t.total_ingresos ?? 0;
    const pernoctaciones = t.total_permanencias ?? 0;
    const estadiaMedia = t.estadia_media_noches ?? 0;

    return [
      {
        titulo: 'Establecimientos Registrados',
        valor: reg.toLocaleString('es-BO'),
        subtexto: dec > 0
          ? `${dec} activo${dec !== 1 ? 's' : ''} en el departamento de Oruro`
          : 'Hoteles, residenciales y alojamientos en Oruro',
        icono: 'hotel',
        color: 'carmesi'
      },
      {
        titulo: 'Formularios Declarados (Mes Activo)',
        valor: forms.toLocaleString('es-BO'),
        subtexto: `${cob}% de cobertura de presentación departamental`,
        icono: 'clipboard',
        color: 'emerald'
      },
      {
        titulo: 'Total Huéspedes Registrados',
        valor: huespedes.toLocaleString('es-BO'),
        subtexto: `Nacionales y extranjeros (${ingresos.toLocaleString('es-BO')} llegadas)`,
        icono: 'users',
        color: 'blue'
      },
      {
        titulo: 'Pernoctaciones Acumuladas',
        valor: pernoctaciones.toLocaleString('es-BO'),
        subtexto: estadiaMedia > 0
          ? `${estadiaMedia} noches promedio de estadía en Oruro`
          : 'Noches totales de estadía en el departamento',
        icono: 'moon',
        color: 'amber'
      }
    ];
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      tablero: this.reportesService.getTableroEjecutivo(),
      formularios: this.formulariosService.listarEstadisticas({ limit: 8 })
    }).subscribe({
      next: ({ tablero, formularios }) => {
        this.tablero.set(tablero);
        this.ultimosFormularios.set(formularios || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos del panel de inicio admin:', err);
        this.errorCarga.set('No se pudieron obtener los datos en tiempo real de la API.');
        this.cargando.set(false);
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

  abrirRevision(formularioId: number, numeroFormulario?: string): void {
    this.formularioNumeroSeleccionado.set(numeroFormulario || null);
    this.formularioParaRevisarId.set(formularioId);
  }

  cerrarRevision(): void {
    this.formularioParaRevisarId.set(null);
    this.formularioNumeroSeleccionado.set(null);
  }

  onFormularioActualizado(actualizado: EstadisticaHoteleraResponse): void {
    // Actualizar la lista local inmediatamente
    this.ultimosFormularios.update((list) =>
      list.map((item) => (item.id === actualizado.id ? actualizado : item))
    );
    // Refrescar KPIs consolidados desde el backend
    this.reportesService.getTableroEjecutivo().subscribe({
      next: (t) => this.tablero.set(t),
      error: (e) => console.warn('No se pudo refrescar el tablero tras dictamen:', e)
    });
  }
}

