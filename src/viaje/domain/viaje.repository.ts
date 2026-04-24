import { Viaje } from './viaje.entity';

export interface IViajeRepository {
  crear(viaje: Viaje): Promise<Viaje>;
  buscarPorId(id: string): Promise<Viaje | null>;
  actualizar(viaje: Viaje): Promise<Viaje>;
  actualizarEstado(id: string, estado: string): Promise<boolean>;
  actualizarConductor(id: string, conductorId: string): Promise<boolean>;
  obtenerHistorial(conductorId: string): Promise<any[]>;
}
