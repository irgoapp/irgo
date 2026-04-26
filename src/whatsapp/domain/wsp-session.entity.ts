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
