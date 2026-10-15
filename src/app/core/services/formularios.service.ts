import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PeriodosDisponiblesResponse,
  EstadisticaHoteleraCreate,
  EstadisticaHoteleraResponse,
  OcupacionHoteleraResponse,
  EstadoFormulario,
  RespaldoAdjuntoResponse
} from '../models/formulario.models';
import { Nacionalidad } from '../models/nacionalidad.models';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FormulariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getPeriodosDisponibles(
    gestion: number,
    tipo: 'estadistica' | 'ocupacion' = 'estadistica'
  ): Observable<PeriodosDisponiblesResponse> {
    const params = new HttpParams()
      .set('gestion', gestion.toString())
      .set('tipo_formulario', tipo);
    return this.http.get<PeriodosDisponiblesResponse>(
      `${this.baseUrl}/formularios/periodos-disponibles`,
      { params }
    );
  }

  subirFotoRespaldo(
    file: File,
    tipo: 'estadistica' | 'ocupacion' = 'estadistica',
    idEstablecimiento?: number | null
  ): Observable<RespaldoAdjuntoResponse> {
    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams().set('tipo_formulario', tipo);
    if (idEstablecimiento) {
      params = params.set('id_establecimiento', idEstablecimiento.toString());
    }

    return this.http.post<RespaldoAdjuntoResponse>(
      `${this.baseUrl}/formularios/subir-respaldo`,
      formData,
      { params }
    );
  }

  crearEstadisticaHotelera(data: EstadisticaHoteleraCreate): Observable<EstadisticaHoteleraResponse> {
    return this.http.post<EstadisticaHoteleraResponse>(
      `${this.baseUrl}/estadisticas-hoteleras/`,
      data
    );
  }

  getNacionalidades(soloActivos: boolean = true): Observable<Nacionalidad[]> {
    const params = new HttpParams().set('solo_activos', soloActivos.toString());
    return this.http.get<Nacionalidad[]>(`${this.baseUrl}/nacionalidades/`, { params });
  }

  listarEstadisticas(filtros?: {
    mes?: string;
    gestion?: number;
    estado?: EstadoFormulario;
    skip?: number;
    limit?: number;
  }): Observable<EstadisticaHoteleraResponse[]> {
    let params = new HttpParams();
    if (filtros?.mes) params = params.set('mes', filtros.mes);
    if (filtros?.gestion) params = params.set('gestion', filtros.gestion.toString());
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.skip !== undefined) params = params.set('skip', filtros.skip.toString());
    if (filtros?.limit !== undefined) params = params.set('limit', filtros.limit.toString());

    return this.http
      .get<EstadisticaHoteleraResponse[] | { items: EstadisticaHoteleraResponse[] }>(
        `${this.baseUrl}/estadisticas-hoteleras/`,
        { params }
      )
      .pipe(
        map((res) => (Array.isArray(res) ? res : res.items || []))
      );
  }

  listarOcupaciones(filtros?: {
    mes?: string;
    gestion?: number;
    estado?: EstadoFormulario;
    skip?: number;
    limit?: number;
  }): Observable<OcupacionHoteleraResponse[]> {
    let params = new HttpParams();
    if (filtros?.mes) params = params.set('mes', filtros.mes);
    if (filtros?.gestion) params = params.set('gestion', filtros.gestion.toString());
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.skip !== undefined) params = params.set('skip', filtros.skip.toString());
    if (filtros?.limit !== undefined) params = params.set('limit', filtros.limit.toString());

    return this.http
      .get<OcupacionHoteleraResponse[] | { items: OcupacionHoteleraResponse[] }>(
        `${this.baseUrl}/ocupacion-hotelera/`,
        { params }
      )
      .pipe(
        map((res) => (Array.isArray(res) ? res : res.items || []))
      );
  }

  // Obtener formulario de Estadística Hotelera completo por ID
  obtenerEstadistica(id: number): Observable<EstadisticaHoteleraResponse> {
    return this.http.get<EstadisticaHoteleraResponse>(`${this.baseUrl}/estadisticas-hoteleras/${id}`);
  }

  // Actualizar estado de formulario de Estadística Hotelera (Aprobar u Observar)
  actualizarEstadoEstadistica(
    id: number,
    estado: EstadoFormulario,
    observaciones?: string | null
  ): Observable<EstadisticaHoteleraResponse> {
    const payload: { estado: EstadoFormulario; observaciones?: string | null } = { estado };
    if (observaciones !== undefined) {
      payload.observaciones = observaciones;
    }
    return this.http.put<EstadisticaHoteleraResponse>(
      `${this.baseUrl}/estadisticas-hoteleras/${id}`,
      payload
    );
  }

  // Obtener formulario de Ocupación Hotelera completo por ID
  obtenerOcupacion(id: number): Observable<OcupacionHoteleraResponse> {
    return this.http.get<OcupacionHoteleraResponse>(`${this.baseUrl}/ocupacion-hotelera/${id}`);
  }

  // Actualizar estado de formulario de Ocupación Hotelera
  actualizarEstadoOcupacion(
    id: number,
    estado: EstadoFormulario,
    observaciones?: string | null
  ): Observable<OcupacionHoteleraResponse> {
    const payload: { estado: EstadoFormulario; observaciones?: string | null } = { estado };
    if (observaciones !== undefined) {
      payload.observaciones = observaciones;
    }
    return this.http.put<OcupacionHoteleraResponse>(
      `${this.baseUrl}/ocupacion-hotelera/${id}`,
      payload
    );
  }
}

