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

export interface EstablecimientoUpdate {
  nombre_establecimiento?: string | null;
  direccion?: string | null;
  categoria?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  total_plazas?: number | null;
  activo?: boolean | null;
}

export interface HabitacionItemInput {
  id_tipo_habitacion: number;
  cant_habitaciones: number;
  nro_camas: number;
}

export interface CapacidadHabitacionesUpdate {
  habitaciones: HabitacionItemInput[];
}

export interface TipoHabitacionResponse {
  id: number;
  tipo_habitacion: string;
  descripcion?: string | null;
}

export interface DependienteCreate {
  nombre_completo: string;
  email: string;
  password?: string | null;
}

export interface DependienteUpdate {
  nombre_completo?: string | null;
  email?: string | null;
  activo?: boolean | null;
}


