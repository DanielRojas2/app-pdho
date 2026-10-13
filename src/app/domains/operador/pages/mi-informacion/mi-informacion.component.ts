import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstablecimientoService } from '../../../../core/services/establecimiento.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Usuario } from '../../../../core/models/auth.models';
import {
  EstablecimientoResponse,
  EstablecimientoUpdate,
  CapacidadHabitacionesUpdate,
  HabitacionItemInput,
  TipoHabitacionResponse,
  DependienteCreate,
  DependienteUpdate
} from '../../../../core/models/establecimiento.models';

@Component({
  selector: 'app-mi-informacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-informacion.component.html',
  styleUrl: './mi-informacion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiInformacionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly establecimientoService = inject(EstablecimientoService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  // Estados Reactivos con Signals
  readonly establecimiento = signal<EstablecimientoResponse | null>(null);
  readonly tiposHabitacion = signal<TipoHabitacionResponse[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly modoEdicion = signal<boolean>(false);
  readonly subPestanaActiva = signal<'ficha' | 'capacidad' | 'operador'>('ficha');

  // Estados Reactivos para Dependientes
  readonly dependientes = signal<Usuario[]>([]);
  readonly cargandoDependientes = signal<boolean>(false);
  readonly mostrarModalDependiente = signal<boolean>(false);
  readonly guardandoDependiente = signal<boolean>(false);

  // Formulario de Registro de Dependiente
  readonly formDependiente: FormGroup = this.fb.group({
    nombre_completo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]]
  });

  // Categorías oficiales
  readonly categorias = [
    { valor: '5_estrellas', etiqueta: 'Hotel 5 Estrellas' },
    { valor: '4_estrellas', etiqueta: 'Hotel 4 Estrellas' },
    { valor: '3_estrellas', etiqueta: 'Hotel 3 Estrellas' },
    { valor: '2_estrellas', etiqueta: 'Hotel 2 Estrellas' },
    { valor: '1_estrella', etiqueta: 'Hotel 1 Estrella' },
    { valor: 'residencial', etiqueta: 'Residencial' },
    { valor: 'alojamiento', etiqueta: 'Alojamiento' },
    { valor: 'hostal', etiqueta: 'Hostal' },
    { valor: 'casa_huespedes', etiqueta: 'Casa de Huéspedes' }
  ];

  // Formulario General del Establecimiento (PATCH)
  readonly formEstablecimiento: FormGroup = this.fb.group({
    nombre_establecimiento: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    categoria: ['3_estrellas', [Validators.required]],
    telefono: [''],
    latitud: [null as number | null],
    longitud: [null as number | null],
    total_plazas: [0, [Validators.required, Validators.min(0)]]
  });

  // Array Reactivo para Capacidad Instalada por Tipo de Habitación (PUT)
  readonly habitacionesFormArray: FormArray<FormGroup> = this.fb.array<FormGroup>([]);

  // Cálculos reactivos de capacidad durante la edición
  readonly totalHabitacionesCalculado = computed(() => {
    return this.habitacionesFormArray.controls.reduce((acc, ctrl) => {
      const cant = Number(ctrl.get('cant_habitaciones')?.value) || 0;
      return acc + cant;
    }, 0);
  });

  readonly totalCamasCalculado = computed(() => {
    return this.habitacionesFormArray.controls.reduce((acc, ctrl) => {
      const camas = Number(ctrl.get('nro_camas')?.value) || 0;
      return acc + camas;
    }, 0);
  });

  ngOnInit(): void {
    this.cargarDatos();
    if (this.authService.isOperador()) {
      this.cargarDependientes();
    }
  }

  cargarDatos(): void {
    this.cargando.set(true);

    // Cargar tipos de habitación del catálogo y datos del establecimiento propio
    this.establecimientoService.getTiposHabitacion().subscribe({
      next: (catalogo) => {
        this.tiposHabitacion.set(catalogo);
        this.cargarEstablecimientoPropio();
      },
      error: (err) => {
        console.error('Error al cargar tipos de habitación:', err);
        this.cargarEstablecimientoPropio();
      }
    });
  }

  private cargarEstablecimientoPropio(): void {
    this.establecimientoService.getMiEstablecimiento().subscribe({
      next: (est) => {
        this.establecimiento.set(est);
        this.poblarFormulario(est);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        console.error('Error al consultar mi-establecimiento:', err);
        this.toastService.error('No se pudo cargar la información del establecimiento. Verifique su sesión.');
      }
    });
  }

  cargarDependientes(): void {
    if (!this.authService.isOperador()) {
      return;
    }

    this.cargandoDependientes.set(true);
    this.establecimientoService.listMisDependientes().subscribe({
      next: (deps) => {
        this.dependientes.set(deps);
        this.cargandoDependientes.set(false);
      },
      error: (err) => {
        this.cargandoDependientes.set(false);
        console.error('Error al cargar dependientes:', err);
      }
    });
  }

  abrirModalDependiente(): void {
    if (!this.authService.isOperador()) {
      return;
    }

    this.formDependiente.reset({
      nombre_completo: '',
      email: ''
    });
    this.mostrarModalDependiente.set(true);
  }

  cerrarModalDependiente(): void {
    this.mostrarModalDependiente.set(false);
  }

  guardarDependiente(): void {
    if (!this.authService.isOperador()) {
      return;
    }

    if (this.formDependiente.invalid) {
      this.formDependiente.markAllAsTouched();
      this.toastService.warning('Complete los campos requeridos para registrar al dependiente.');
      return;
    }

    this.guardandoDependiente.set(true);
    const formVal = this.formDependiente.getRawValue();

    const payload: DependienteCreate = {
      nombre_completo: formVal.nombre_completo.trim(),
      email: formVal.email.trim()
    };

    this.establecimientoService.createDependiente(payload).subscribe({
      next: (creado) => {
        this.guardandoDependiente.set(false);
        this.cerrarModalDependiente();
        this.toastService.success(`Dependiente "${creado.nombre_completo}" registrado exitosamente. Credenciales despachadas por correo.`);
        this.cargarDependientes();
      },
      error: (err) => {
        this.guardandoDependiente.set(false);
        const detalle = err.error?.detail;
        if (typeof detalle === 'string') {
          this.toastService.error(detalle);
        } else if (Array.isArray(detalle) && detalle.length > 0) {
          this.toastService.error(`Validación: ${detalle[0].msg}`);
        } else {
          this.toastService.error('No se pudo registrar al dependiente. Verifique los datos.');
        }
        console.error('Error al registrar dependiente:', err);
      }
    });
  }

  toggleEstadoDependiente(dep: Usuario): void {
    if (!this.authService.isOperador()) {
      return;
    }

    const nuevoEstado = !dep.activo;
    const accion = nuevoEstado ? 'habilitar' : 'deshabilitar';

    this.establecimientoService.updateDependiente(dep.id, { activo: nuevoEstado }).subscribe({
      next: () => {
        this.toastService.success(`Dependiente "${dep.nombre_completo}" ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente.`);
        this.cargarDependientes();
      },
      error: (err) => {
        console.error(`Error al ${accion} dependiente:`, err);
        this.toastService.error(`No se pudo ${accion} al dependiente.`);
      }
    });
  }

  private poblarFormulario(est: EstablecimientoResponse): void {
    this.formEstablecimiento.patchValue({
      nombre_establecimiento: est.nombre_establecimiento,
      direccion: est.direccion,
      categoria: est.categoria,
      telefono: est.telefono || '',
      latitud: est.latitud,
      longitud: est.longitud,
      total_plazas: est.total_plazas || 0
    });

    // Construir los controles de habitaciones
    this.habitacionesFormArray.clear();
    const catalogo = this.tiposHabitacion();

    catalogo.forEach((tipo) => {
      const existente = est.habitaciones.find(
        (h) => h.id_tipo_habitacion === tipo.id || h.tipo_habitacion?.toLowerCase() === tipo.tipo_habitacion?.toLowerCase()
      );

      const group = this.fb.group({
        id_tipo_habitacion: [tipo.id],
        tipo_nombre: [tipo.tipo_habitacion],
        descripcion: [tipo.descripcion || ''],
        cant_habitaciones: [existente ? existente.cant_habitaciones : 0, [Validators.min(0)]],
        nro_camas: [existente ? existente.nro_camas : 0, [Validators.min(0)]]
      });

      this.habitacionesFormArray.push(group);
    });
  }

  activarEdicion(): void {
    if (!this.authService.isOperador()) {
      this.toastService.warning('Solo el operador titular tiene permisos para editar la información del establecimiento.');
      return;
    }

    const est = this.establecimiento();
    if (est) {
      this.poblarFormulario(est);
    }
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    const est = this.establecimiento();
    if (est) {
      this.poblarFormulario(est);
    }
    this.modoEdicion.set(false);
  }

  seleccionarSubPestana(pestana: 'ficha' | 'capacidad' | 'operador'): void {
    this.subPestanaActiva.set(pestana);
    if (pestana === 'operador' && this.authService.isOperador()) {
      this.cargarDependientes();
    }
  }

  guardarCambios(): void {
    if (this.formEstablecimiento.invalid) {
      this.formEstablecimiento.markAllAsTouched();
      this.toastService.warning('Complete todos los campos obligatorios antes de guardar.');
      return;
    }

    this.guardando.set(true);
    const formVal = this.formEstablecimiento.getRawValue();

    // Payload para PATCH /api/v1/establecimientos/mi-establecimiento
    const payloadDatos: EstablecimientoUpdate = {
      nombre_establecimiento: formVal.nombre_establecimiento.trim(),
      direccion: formVal.direccion.trim(),
      categoria: formVal.categoria,
      telefono: formVal.telefono ? formVal.telefono.trim() : null,
      latitud: formVal.latitud !== null && formVal.latitud !== '' ? Number(formVal.latitud) : null,
      longitud: formVal.longitud !== null && formVal.longitud !== '' ? Number(formVal.longitud) : null,
      total_plazas: Number(formVal.total_plazas) || 0
    };

    // Payload para PUT /api/v1/establecimientos/mi-establecimiento/capacidad
    const habitacionesPayload: HabitacionItemInput[] = this.habitacionesFormArray.controls
      .map((ctrl) => ctrl.getRawValue())
      .filter((h) => Number(h.cant_habitaciones) > 0 || Number(h.nro_camas) > 0)
      .map((h) => ({
        id_tipo_habitacion: Number(h.id_tipo_habitacion),
        cant_habitaciones: Number(h.cant_habitaciones) || 0,
        nro_camas: Number(h.nro_camas) || 0
      }));

    const payloadCapacidad: CapacidadHabitacionesUpdate = {
      habitaciones: habitacionesPayload
    };

    // Ejecución consolidada en una sola vista y flujo
    this.establecimientoService.actualizarTodo(payloadDatos, payloadCapacidad).subscribe({
      next: (actualizado) => {
        this.guardando.set(false);
        this.modoEdicion.set(false);
        this.establecimiento.set(actualizado);
        this.poblarFormulario(actualizado);
        this.toastService.success('Información general y capacidad instalada actualizadas con éxito.');
      },
      error: (err) => {
        this.guardando.set(false);
        console.error('Error al actualizar establecimiento y capacidad:', err);
        const detalle = err.error?.detail;
        if (typeof detalle === 'string') {
          this.toastService.error(detalle);
        } else if (Array.isArray(detalle) && detalle.length > 0) {
          this.toastService.error(`Validación: ${detalle[0].msg}`);
        } else {
          this.toastService.error('Ocurrió un error al guardar los cambios del establecimiento.');
        }
      }
    });
  }

  formatCategoria(valor?: string | null): string {
    if (!valor) return 'Sin categoría';
    const encontrada = this.categorias.find((c) => c.valor === valor);
    if (encontrada) return encontrada.etiqueta;
    return valor.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  getMapaUrl(lat?: number | null, lng?: number | null): string {
    if (!lat || !lng) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
}
