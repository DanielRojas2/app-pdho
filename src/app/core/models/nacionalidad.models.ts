export interface Nacionalidad {
  id: number;
  pais: string;
  cod_pais: string; // ISO 3166-1 alfa-2 (BO, AR, etc.) o códigos oficiales
  continente?: string | null;
  activo: boolean;
}

export interface NacionalidadQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  continente?: string;
  solo_activos?: boolean;
}
