import { Usuario } from './auth.models';

export interface HabitacionItem {
  id_tipo_habitacion: number;
  tipo_habitacion?: string;
  cant_habitaciones: number;
  nro_camas: number;
}

export interface EstablecimientoResponse {
  id: number;
  nombre_establecimiento: string;
  direccion: string;
  categoria: string;
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  total_habitaciones: number;
  total_plazas: number;
  id_operador: number | null;
  activo: boolean;
  fecha_registro: string;
  operador?: Usuario | null;
  habitaciones: HabitacionItem[];
}

export interface EstablecimientoCreateConOperador {
  nombre_establecimiento: string;
  direccion: string;
  categoria: string;
  operador_nombre_completo: string;
  operador_email: string;
  telefono?: string | null;
  operador_password?: string | null;
}

export interface EstablecimientoQueryParams {
  skip?: number;
  limit?: number;
  categoria?: string;
  solo_activos?: boolean;
  buscar?: string;
}
