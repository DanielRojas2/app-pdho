export interface PeriodoReporte {
  tipo_filtro?: 'rango_fechas' | 'mes_gestion' | 'rango_gestiones' | 'general' | 'gestion_unica' | string;
  descripcion?: string;
  mes?: string | null;
  gestion?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  gestion_inicio?: number | null;
  gestion_fin?: number | null;
}

export interface SegmentoHuespedes {
  pais?: string | null;
  cod_pais?: string | null;
  cant_ingresos: number;
  cant_permanencias: number;
  total: number;
  porcentaje_ingresos: number;
  porcentaje_permanencias: number;
  porcentaje_total: number;
}

export interface TotalesHuespedes {
  total_ingresos: number;
  total_permanencias: number;
  total_general: number;
}

export interface GraficoTortaNacionalesExtranjerosResponse {
  periodo: PeriodoReporte;
  totales_generales: TotalesHuespedes;
  nacionales: SegmentoHuespedes;
  extranjeros: SegmentoHuespedes;
}

export interface NacionalidadRankingItem {
  ranking: number;
  id_nacionalidad: number;
  pais: string;
  cod_pais: string;
  continente?: string | null;
  cant_ingresos: number;
  cant_permanencias: number;
  total_afluencia: number;
  porcentaje_del_total: number;
}

export interface GraficoBarrasRankingResponse {
  periodo: PeriodoReporte;
  total_paises_con_movimiento: number;
  criterio_orden: string;
  top_10: NacionalidadRankingItem[];
  resto: NacionalidadRankingItem[];
  totales_periodo?: {
    total_ingresos: number;
    total_permanencias: number;
    total_afluencia: number;
  };
}

export interface SerieComparativaItem {
  etiqueta: string;
  codigo?: string | null;
  id_nacionalidad?: number | null;
  ingresos: number;
  permanencias: number;
  total: number;
  ratio_permanencia_ingreso: number;
}

export interface PermanenciasVsIngresosResponse {
  periodo: PeriodoReporte;
  agrupacion: string;
  filtro_paises_aplicado?: string[] | null;
  series: SerieComparativaItem[];
  totales: {
    total_ingresos: number;
    total_permanencias: number;
    ratio_promedio: number;
  };
}

export interface FiltroReportesParam {
  mes?: string;
  gestion?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  gestion_inicio?: number;
  gestion_fin?: number;
  categoria?: string;
  id_establecimiento?: number;
  codigos_pais?: string[];
  criterio_orden?: 'total_afluencia' | 'ingresos' | 'permanencias';
}

export interface TableroEjecutivoResponse {
  periodo: PeriodoReporte;
  establecimientos_registrados: number;
  establecimientos_declarantes: number;
  porcentaje_cobertura_establecimientos: number;
  total_formularios_declarados: number;
  total_ingresos: number;
  total_permanencias: number;
  total_huespedes: number;
  total_habitaciones_ofertadas: number;
  total_habitaciones_ocupadas: number;
  tasa_ocupacion_porcentaje: number;
  estadia_media_noches: number;
}

export interface EstablecimientoCumplimientoItem {
  id_establecimiento: number;
  nombre_establecimiento: string;
  categoria: string;
  telefono?: string | null;
  tiene_estadistica: boolean;
  id_estadistica?: number | null;
  estado_estadistica?: string | null;
  tiene_ocupacion: boolean;
  id_ocupacion?: number | null;
  estado_ocupacion?: string | null;
  cumplimiento_completo: boolean;
}

export interface CumplimientoDeclaracionesResponse {
  mes: string;
  gestion: number;
  total_establecimientos: number;
  total_al_dia: number;
  total_pendientes: number;
  porcentaje_cumplimiento: number;
  establecimientos: EstablecimientoCumplimientoItem[];
}

