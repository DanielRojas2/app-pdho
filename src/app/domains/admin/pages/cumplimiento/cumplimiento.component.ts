import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EstablecimientoCumplimiento {
  id: number;
  nombre: string;
  categoria: string;
  operador: string;
  telefono: string;
  estado: 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO';
  fecha?: string;
  nroFormulario?: string;
}

@Component({
  selector: 'app-admin-cumplimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cumplimiento.component.html',
  styleUrl: './cumplimiento.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CumplimientoComponent {
  readonly filtroEstado = signal<'TODOS' | 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO'>('TODOS');
  readonly terminoBusqueda = signal('');

  readonly listaHoteles = signal<EstablecimientoCumplimiento[]>([
    { id: 1, nombre: 'Hotel Eden by Bluebay', categoria: '5 Estrellas', operador: 'Carlos Montaño', telefono: '52-52000', estado: 'DECLARADO', fecha: '12/10/2026', nroFormulario: '000360' },
    { id: 2, nombre: 'Gran Sucre Hotel', categoria: '3 Estrellas', operador: 'Mónica Morales', telefono: '52-51234', estado: 'DECLARADO', fecha: '11/10/2026', nroFormulario: '000361' },
    { id: 3, nombre: 'Hotel Terminal Oruro', categoria: '3 Estrellas', operador: 'Roberto Calle', telefono: '52-78900', estado: 'DECLARADO', fecha: '10/10/2026', nroFormulario: '000362' },
    { id: 4, nombre: 'Hotel Regal', categoria: '3 Estrellas', operador: 'Patricia Vaca', telefono: '52-44112', estado: 'PENDIENTE' },
    { id: 5, nombre: 'Residencial América', categoria: 'Residencial', operador: 'Fernando Rojas', telefono: '52-66321', estado: 'DECLARADO', fecha: '08/10/2026', nroFormulario: '000363' },
    { id: 6, nombre: 'Alojamiento San José', categoria: 'Alojamiento', operador: 'Elvira Gómez', telefono: '52-88123', estado: 'OBSERVADO', fecha: '09/10/2026', nroFormulario: '000364' },
    { id: 7, nombre: 'Hostal Virgen del Socavón', categoria: 'Hostal', operador: 'Álvaro Torrico', telefono: '52-77441', estado: 'PENDIENTE' },
    { id: 8, nombre: 'Hotel Repostero', categoria: '2 Estrellas', operador: 'Elena Gutiérrez', telefono: '52-33211', estado: 'PENDIENTE' }
  ]);

  readonly hotelesFiltrados = computed(() => {
    const estado = this.filtroEstado();
    const query = this.terminoBusqueda().toLowerCase().trim();

    return this.listaHoteles().filter((h) => {
      const coincideEstado = estado === 'TODOS' || h.estado === estado;
      const coincideBusqueda = !query || h.nombre.toLowerCase().includes(query) || h.categoria.toLowerCase().includes(query);
      return coincideEstado && coincideBusqueda;
    });
  });

  readonly resumen = computed(() => {
    const list = this.listaHoteles();
    return {
      total: list.length,
      declarados: list.filter(h => h.estado === 'DECLARADO').length,
      pendientes: list.filter(h => h.estado === 'PENDIENTE').length,
      observados: list.filter(h => h.estado === 'OBSERVADO').length,
    };
  });

  setFiltro(estado: 'TODOS' | 'DECLARADO' | 'PENDIENTE' | 'OBSERVADO'): void {
    this.filtroEstado.set(estado);
  }

  onBuscar(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.terminoBusqueda.set(val);
  }
}
