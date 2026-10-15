export type EstadoFormulario = 'BORRADOR' | 'ENVIADO' | 'OBSERVADO' | 'APROBADO';

export interface MesDisponible {
  mes: string;
  numero_mes: number;
  dias_en_mes: number;
  declarado: boolean;
  permitido: boolean;
  formulario_id?: number | null;
}

export interface PeriodosDisponiblesResponse {
  gestion: number;
  meses: MesDisponible[];
}

export interface ResumenEstadistica {
  r_ingreso_nals: number;
  r_ingreso_extr: number;
  r_permanencia_nals: number;
  r_permanencia_extr: number;
  total_nals: number;
  total_extr: number;
  total_ing: number;
  total_perm: number;
  total: number;
}

export interface DetalleMovimientoInput {
  dia: number; // 1 al 31
  id_nacionalidad: number;
  cant_ingresos: number;
  cant_permanencias: number;
}

export interface DetalleMovimientoResponse extends DetalleMovimientoInput {
  id: number;
  pais?: string;
  cod_pais?: string;
}

export interface EstadisticaHoteleraCreate {
  numero_formulario: string; // Ej: "000360"
  mes: string;
  gestion: number;
  fecha_presentacion: string; // YYYY-MM-DD
  cant_emp_perma: number;
  cant_emp_event: number;
  archivo_foto?: string | null;
  archivo_pdf?: string | null;
  detalles: DetalleMovimientoInput[];
  observaciones?: string | null;
  enviar_en_limpio: boolean;
}

export interface EstadisticaHoteleraResponse {
  id: number;
  id_establecimiento: number;
  numero_formulario: string;
  mes: string;
  gestion: number;
  fecha_presentacion: string;
  cant_emp_perma: number;
  cant_emp_event: number;
  total_empleados?: number;
  archivo_foto?: string | null;
  archivo_pdf?: string | null;
  observaciones?: string | null;
  estado: EstadoFormulario;
  fecha_creacion: string;
  fecha_modificacion?: string | null;
  r_ingreso_nals?: number;
  r_ingreso_extr?: number;
  r_permanencia_nals?: number;
  r_permanencia_extr?: number;
  total_nals?: number;
  total_extr?: number;
  total_ing?: number;
  total_perm?: number;
  total?: number;
  detalles: DetalleMovimientoResponse[];
  resumen?: ResumenEstadistica;
  seccion_a?: {
    nombre_establecimiento?: string;
    direccion?: string;
    categoria?: string;
    ciudad?: string;
    telefono?: string;
  };
  seccion_c?: {
    total_habitaciones?: number;
    total_plazas?: number;
    habitaciones?: Array<{
      tipo_habitacion?: string;
      cant_habitaciones?: number;
      nro_camas?: number;
    }>;
  };
}

export interface DetalleOcupacionResponse {
  id: number;
  dia: number;
  hab_ocupadas: number;
  cant_personas: number;
}

export interface OcupacionHoteleraResponse {
  id: number;
  id_establecimiento: number;
  mes: string;
  gestion: number;
  fecha_presentacion: string;
  total_hab_ocupadas: number;
  total_personas: number;
  archivo_foto?: string | null;
  archivo_pdf?: string | null;
  estado: EstadoFormulario;
  observaciones?: string | null;
  fecha_creacion: string;
  fecha_modificacion?: string | null;
  detalles?: DetalleOcupacionResponse[];
}

export interface RespaldoAdjuntoResponse {
  archivo_foto: string;
  archivo_pdf: string;
  mensaje: string;
}
