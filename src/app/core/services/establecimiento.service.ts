import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EstablecimientoResponse,
  EstablecimientoCreateConOperador,
  EstablecimientoQueryParams
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
}
