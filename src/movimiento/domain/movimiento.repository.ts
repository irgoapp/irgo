import { Movimiento } from './movimiento.entity';

export interface IMovimientoRepository {
  obtenerSaldo(conductorId: string): Promise<number>;
  actualizarSaldo(conductorId: string, nuevoSaldo: number): Promise<void>;
  registrarTransaccion(movimiento: Movimiento): Promise<void>;
  buscarPorSolicitudYTipo(solicitudId: string, tipo: string): Promise<Movimiento | null>;
  obtenerHistorial(conductorId: string, limite: number): Promise<Movimiento[]>;
}
