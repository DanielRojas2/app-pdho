import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  output,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormulariosService } from '../../../../core/services/formularios.service';
import { EstadisticaHoteleraResponse, EstadoFormulario } from '../../../../core/models/formulario.models';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-modal-revision-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-revision-formulario.component.html',
  styleUrl: './modal-revision-formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalRevisionFormularioComponent {
  private readonly formulariosService = inject(FormulariosService);
  private readonly sanitizer = inject(DomSanitizer);

  // Inputs reactivos
  readonly formularioId = input.required<number>();
  readonly numeroFormularioInicial = input<string | null>(null);

  // Outputs reactivos
  readonly cerrar = output<void>();
  readonly formularioActualizado = output<EstadisticaHoteleraResponse>();

  // Estados locales con Signals
  readonly cargando = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);
  readonly formulario = signal<EstadisticaHoteleraResponse | null>(null);

  // Estado del visor de respaldo integrado (imagen / PDF)
  readonly visorRespaldoAbierto = signal<boolean>(false);
  readonly tipoVisorRespaldo = signal<'imagen' | 'pdf' | null>(null);
  readonly urlVisorRespaldo = signal<string | null>(null);
  readonly tituloVisorRespaldo = signal<string>('');

  readonly urlVisorSegura = computed<SafeResourceUrl | null>(() => {
    const url = this.urlVisorRespaldo();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // Modelo de observaciones para dictamen
  readonly observaciones = signal<string>('');

  constructor() {
    effect(() => {
      const id = this.formularioId();
      if (id) {
        this.cargarDetalle(id);
      }
    });
  }

  cargarDetalle(id: number): void {
    this.cargando.set(true);
    this.errorMsg.set(null);

    this.formulariosService.obtenerEstadistica(id).subscribe({
      next: (res) => {
        this.formulario.set(res);
        this.observaciones.set(res.observaciones || '');
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener detalle de la estadística:', err);
        this.errorMsg.set('No se pudo cargar la información de la declaración desde la API.');
        this.cargando.set(false);
      }
    });
  }

  aprobarFormulario(): void {
    const f = this.formulario();
    if (!f) return;

    this.guardando.set(true);
    this.errorMsg.set(null);

    const obs = this.observaciones().trim() || null;
    this.formulariosService.actualizarEstadoEstadistica(f.id, 'APROBADO', obs).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.formulario.set(actualizado);
        this.formularioActualizado.emit(actualizado);
      },
      error: (err) => {
        console.error('Error al aprobar la recepción del formulario:', err);
        this.errorMsg.set('Ocurrió un error al intentar aprobar la declaración en la API.');
        this.guardando.set(false);
      }
    });
  }

  observarFormulario(): void {
    const f = this.formulario();
    if (!f) return;

    const obs = this.observaciones().trim();
    if (!obs) {
      this.errorMsg.set('Para observar el formulario debe ingresar el motivo u observaciones.');
      return;
    }

    this.guardando.set(true);
    this.errorMsg.set(null);

    this.formulariosService.actualizarEstadoEstadistica(f.id, 'OBSERVADO', obs).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.formulario.set(actualizado);
        this.formularioActualizado.emit(actualizado);
      },
      error: (err) => {
        console.error('Error al observar la declaración:', err);
        this.errorMsg.set('Ocurrió un error al registrar las observaciones en la API.');
        this.guardando.set(false);
      }
    });
  }

  onCerrar(): void {
    if (this.visorRespaldoAbierto()) {
      this.cerrarVisorRespaldo();
      return;
    }
    this.cerrar.emit();
  }

  abrirVisorImagen(): void {
    const url = this.getUrlFoto();
    if (!url) return;
    const f = this.formulario();
    const num = f?.numero_formulario || this.numeroFormularioInicial() || '';
    this.urlVisorRespaldo.set(url);
    this.tipoVisorRespaldo.set('imagen');
    this.tituloVisorRespaldo.set(`Fotografía Original Escaneada — Declaración #${num}`);
    this.visorRespaldoAbierto.set(true);
  }

  abrirVisorPdf(): void {
    const url = this.getUrlPdf();
    if (!url) return;
    const f = this.formulario();
    const num = f?.numero_formulario || this.numeroFormularioInicial() || '';
    this.urlVisorRespaldo.set(url);
    this.tipoVisorRespaldo.set('pdf');
    this.tituloVisorRespaldo.set(`Formulario Oficial Digitalizado (PDF) — Declaración #${num}`);
    this.visorRespaldoAbierto.set(true);
  }

  cerrarVisorRespaldo(): void {
    this.visorRespaldoAbierto.set(false);
    this.urlVisorRespaldo.set(null);
    this.tipoVisorRespaldo.set(null);
  }

  getUrlPdf(): string | null {
    const pdf = this.formulario()?.archivo_pdf;
    if (!pdf) return null;
    if (pdf.startsWith('http://') || pdf.startsWith('https://')) return pdf;
    const apiBase = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = pdf.startsWith('/') ? pdf : '/' + pdf;
    return `${apiBase}${cleanPath}`;
  }

  getUrlFoto(): string | null {
    const foto = this.formulario()?.archivo_foto;
    if (!foto) return null;
    if (foto.startsWith('http://') || foto.startsWith('https://')) return foto;
    const apiBase = environment.apiUrl.replace(/\/+$/, '');
    const cleanPath = foto.startsWith('/') ? foto : '/' + foto;
    return `${apiBase}${cleanPath}`;
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
}
