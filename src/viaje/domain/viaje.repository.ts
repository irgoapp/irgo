import { Viaje } from './viaje.entity';

export interface IViajeRepository {
  crear(viaje: Viaje): Promise<Viaje>;
  buscarPorId(id: string): Promise<Viaje | null>;
  actualizar(viaje: Viaje): Promise<Viaje>;
  actualizarEstado(id: string, estado: string, metadata?: { cancelado_por?: string, cancelado_motivo?: string }): Promise<boolean>;
  asignarConductor(id: string, conductorId: string, rutaRecogida?: any[]): Promise<boolean>;
  obtenerHistorial(conductorId: string, filtro?: { inicio?: string, fin?: string }): Promise<{ metricas: any, historial: any[] }>;
  buscarActivoPorConductor(conductorId: string): Promise<Viaje | null>;
}
