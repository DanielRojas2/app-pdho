import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { ToastService } from '../../../../core/services/toast.service';
import { EstablecimientoResponse, EstablecimientoCreateConOperador } from '../../../../core/models/establecimiento.models';

@Component({
  selector: 'app-admin-establecimientos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './establecimientos.component.html',
  styleUrl: './establecimientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstablecimientosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly establecimientoService = inject(EstablecimientoService);
  private readonly toastService = inject(ToastService);

  // Estados Reactivos con Signals
  readonly establecimientos = signal<EstablecimientoResponse[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly terminoBusqueda = signal<string>('');

  // Categorías oficiales
  readonly categorias = [
    { valor: '5_estrellas', etiqueta: '5 Estrellas' },
    { valor: '4_estrellas', etiqueta: '4 Estrellas' },
    { valor: '3_estrellas', etiqueta: '3 Estrellas' },
    { valor: '2_estrellas', etiqueta: '2 Estrellas' },
    { valor: '1_estrella', etiqueta: '1 Estrella' },
    { valor: 'residencial', etiqueta: 'Residencial' },
    { valor: 'alojamiento', etiqueta: 'Alojamiento' },
    { valor: 'hostal', etiqueta: 'Hostal' },
    { valor: 'casa_huespedes', etiqueta: 'Casa de Huéspedes' }
  ];

  // Formulario de Registro
  readonly registroForm: FormGroup = this.fb.group({
    nombre_establecimiento: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    categoria: ['4_estrellas', [Validators.required]],
    operador_nombre_completo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    operador_email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.cargarEstablecimientos();
  }

  cargarEstablecimientos(): void {
    this.cargando.set(true);
    const busqueda = this.terminoBusqueda().trim();

    this.establecimientoService.listar(busqueda ? { buscar: busqueda } : undefined).subscribe({
      next: (datos) => {
        this.establecimientos.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toastService.error('Error al conectar con la API de establecimientos.');
        console.error('Error cargando establecimientos:', err);
      }
    });
  }

  onBuscar(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.terminoBusqueda.set(val);
    this.cargarEstablecimientos();
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.toastService.warning('Complete todos los campos obligatorios requeridos.');
      return;
    }

    this.guardando.set(true);
    const formVal = this.registroForm.getRawValue();

    const payload: EstablecimientoCreateConOperador = {
      nombre_establecimiento: formVal.nombre_establecimiento.trim(),
      direccion: formVal.direccion.trim(),
      categoria: formVal.categoria,
      operador_nombre_completo: formVal.operador_nombre_completo.trim(),
      operador_email: formVal.operador_email.trim()
    };

    this.establecimientoService.crearConOperador(payload).subscribe({
      next: (creado) => {
        this.guardando.set(false);
        this.toastService.success(`Establecimiento "${creado.nombre_establecimiento}" registrado y credenciales enviadas.`);
        this.registroForm.reset({
          nombre_establecimiento: '',
          direccion: '',
          categoria: '4_estrellas',
          operador_nombre_completo: '',
          operador_email: ''
        });
        this.cargarEstablecimientos();
      },
      error: (err) => {
        this.guardando.set(false);
        const detalle = err.error?.detail;
        if (typeof detalle === 'string') {
          this.toastService.error(detalle);
        } else if (Array.isArray(detalle) && detalle.length > 0) {
          this.toastService.error(`Validación: ${detalle[0].msg}`);
        } else {
          this.toastService.error('No se pudo registrar el establecimiento. Verifique los datos.');
        }
        console.error('Error al crear establecimiento:', err);
      }
    });
  }

  formatCategoria(valor: string): string {
    const encontrada = this.categorias.find((c) => c.valor === valor);
    return encontrada ? encontrada.etiqueta : valor;
  }
}
