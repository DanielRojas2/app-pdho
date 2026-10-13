import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadisticasComponent {
  readonly gestionSeleccionada = signal(2026);
  readonly mesSeleccionado = signal('Octubre');

  readonly distribucionHuespedes = signal({
    total: 16420,
    nacionales: { cantidad: 11822, porcentaje: 72 },
    extranjeros: { cantidad: 4598, porcentaje: 28 }
  });

  readonly topPaises = signal([
    { pais: 'Chile', llegadas: 1420, noches: 2840, porcentaje: 30.8 },
    { pais: 'Perú', llegadas: 980, noches: 1860, porcentaje: 21.3 },
    { pais: 'Argentina', llegadas: 840, noches: 1620, porcentaje: 18.2 },
    { pais: 'Francia', llegadas: 410, noches: 920, porcentaje: 8.9 },
    { pais: 'Alemania', llegadas: 320, noches: 750, porcentaje: 6.9 }
  ]);
}
