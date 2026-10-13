export type RolUsuario = 'ADMIN_DEPARTAMENTAL' | 'OPERADOR_HOSPEDAJE' | 'DEPENDIENTE_HOSPEDAJE';

export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  rol: RolUsuario;
  id_establecimiento: number | null;
  activo: boolean;
  credenciales_enviadas: boolean;
  fecha_creacion: string;
  ultimo_login?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario?: Usuario;
  user?: Usuario;
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorDetail {
  detail?: string | ApiValidationError[];
  message?: string;
}
