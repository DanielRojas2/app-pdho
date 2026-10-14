export interface PeriodoReporte {
  mes?: string | null;
  gestion?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
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
  categoria?: string;
  id_establecimiento?: number;
  codigos_pais?: string[];
  criterio_orden?: 'total_afluencia' | 'ingresos' | 'permanencias';
}
