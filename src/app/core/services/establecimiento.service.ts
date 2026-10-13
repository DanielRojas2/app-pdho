import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, concatMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/auth.models';
import {
  EstablecimientoResponse,
  EstablecimientoCreateConOperador,
  EstablecimientoQueryParams,
  EstablecimientoUpdate,
  CapacidadHabitacionesUpdate,
  TipoHabitacionResponse,
  DependienteCreate,
  DependienteUpdate
} from '../models/establecimiento.models';

@Injectable({
  providedIn: 'root'
})
export class EstablecimientoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/establecimientos`;

  listar(filtros?: EstablecimientoQueryParams): Observable<EstablecimientoResponse[]> {
    let params = new HttpParams();

    if (filtros) {
      if (filtros.skip !== undefined) params = params.set('skip', filtros.skip.toString());
      if (filtros.limit !== undefined) params = params.set('limit', filtros.limit.toString());
      if (filtros.categoria) params = params.set('categoria', filtros.categoria);
      if (filtros.solo_activos !== undefined) params = params.set('solo_activos', filtros.solo_activos.toString());
      if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    }

    return this.http.get<EstablecimientoResponse[]>(`${this.baseUrl}/`, { params });
  }

  crearConOperador(payload: EstablecimientoCreateConOperador): Observable<EstablecimientoResponse> {
    return this.http.post<EstablecimientoResponse>(`${this.baseUrl}/`, payload);
  }

  obtenerPorId(id: number): Observable<EstablecimientoResponse> {
    return this.http.get<EstablecimientoResponse>(`${this.baseUrl}/${id}`);
  }

  // Obtener ficha técnica del establecimiento del usuario en sesión
  getMiEstablecimiento(): Observable<EstablecimientoResponse> {
    return this.http.get<EstablecimientoResponse>(`${this.baseUrl}/mi-establecimiento`);
  }

  // Actualizar datos del establecimiento propio (PATCH)
  updateMiEstablecimiento(payload: EstablecimientoUpdate): Observable<EstablecimientoResponse> {
    return this.http.patch<EstablecimientoResponse>(`${this.baseUrl}/mi-establecimiento`, payload);
  }

  // Actualizar capacidad por tipo de habitación (PUT)
  updateCapacidad(payload: CapacidadHabitacionesUpdate): Observable<EstablecimientoResponse> {
    return this.http.put<EstablecimientoResponse>(`${this.baseUrl}/mi-establecimiento/capacidad`, payload);
  }

  // Listar catálogo de tipos de habitación disponibles (GET)
  getTiposHabitacion(): Observable<TipoHabitacionResponse[]> {
    return this.http.get<TipoHabitacionResponse[]>(`${this.baseUrl}/tipos-habitacion`);
  }

  // Actualizar información completa y capacidad en una sola vista y flujo
  actualizarTodo(
    datos: EstablecimientoUpdate,
    capacidad: CapacidadHabitacionesUpdate
  ): Observable<EstablecimientoResponse> {
    return this.updateMiEstablecimiento(datos).pipe(
      concatMap(() => this.updateCapacidad(capacidad))
    );
  }

  // Listar dependientes del propio establecimiento
  listMisDependientes(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/mi-establecimiento/dependientes`);
  }

  // Registrar un nuevo dependiente en el establecimiento propio
  createDependiente(payload: DependienteCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/mi-establecimiento/dependientes`, payload);
  }

  // Actualizar o habilitar/deshabilitar dependiente propio
  updateDependiente(dependienteId: number, payload: DependienteUpdate): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.baseUrl}/mi-establecimiento/dependientes/${dependienteId}`,
      payload
    );
  }
}


