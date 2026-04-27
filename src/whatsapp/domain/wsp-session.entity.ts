/**
 * Estados del flujo de CREACIÓN de viaje (Rama 1).
 * Solo se usan mientras el cliente NO tiene un viaje activo en solicitudes.
 */
export const ESTADOS_SESION = {
  INICIO: 'INICIO',
  ESPERANDO_UBICACION: 'ESPERANDO_UBICACION',
  ESPERANDO_DESTINO: 'ESPERANDO_DESTINO',
  CONFIRMANDO_VIAJE: 'CONFIRMANDO_VIAJE',
} as const;

export interface SesionWhatsApp {
  telefono: string;
  estado: string;
  contexto: {
    origenLat?: number;
    origenLng?: number;
    destino?: string;
    solicitud_id?: string;
    notificado_espera?: boolean;
    tipo_vehiculo?: string;
  };
  ultima_actividad?: string;
}

export interface ISessionRepository {
  getSession(telefono: string): Promise<SesionWhatsApp | null>;
  upsertSession(telefono: string, estado: string, contexto: any): Promise<boolean>;
  deleteSession(telefono: string): Promise<boolean>;
}
