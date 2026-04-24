import { Conductor } from './conductor.entity';

export interface IConductorRepository {
  buscarPorId(id: string): Promise<Conductor | null>;
  actualizarUbicacion(id: string, lat: number, lon: number): Promise<boolean>;
  cambiarDisponibilidad(id: string, disponible: boolean): Promise<boolean>;
  buscarCercanosDisponibles(lat: number, lon: number, radioKm: number, tipoVehiculo: string): Promise<Conductor[]>;
}
