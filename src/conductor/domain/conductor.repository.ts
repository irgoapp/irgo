import { Conductor } from './conductor.entity';

export interface IConductorRepository {
  buscarPorId(id: string): Promise<Conductor | null>;
  actualizarUbicacion(id: string, lat: number, lng: number): Promise<boolean>;
  cambiarDisponibilidad(id: string, disponible: boolean): Promise<boolean>;
  buscarCercanosDisponibles(lat: number, lng: number, radioKm: number, tipoVehiculo: string, limite?: number, offset?: number): Promise<Conductor[]>;
}
