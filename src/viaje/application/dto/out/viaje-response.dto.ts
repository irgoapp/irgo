import { Viaje } from '../../../domain/viaje.entity';

export class ViajeResponseDto {
  id: string;
  estado: string;
  origen_lat: number;
  origen_lng: number;
  destino_lat: number;
  destino_lng: number;
  destino_texto?: string;
  monto_ruta: number;
  distancia_ruta: number;
  conductor_id?: string;
  conductores?: any; // Para compatibilidad con el hook useRealtimeTrip

  constructor(viaje: Viaje) {
    this.id = viaje.id || '';
    this.estado = viaje.estado;
    this.origen_lat = viaje.origen.lat;
    this.origen_lng = viaje.origen.lon;
    this.destino_lat = viaje.destino.lat;
    this.destino_lng = viaje.destino.lon;
    this.destino_texto = viaje.destino_texto || '';
    this.monto_ruta = viaje.precio || 0;
    this.distancia_ruta = viaje.distancia_km || 0;
    this.conductor_id = viaje.conductor_id;
    
    // Si hay conductor, preparamos el objeto anidado que busca el frontend
    if (viaje.conductor_id) {
       this.conductores = {
         id: viaje.conductor_id
         // Se puede expandir con nombre/calificación si el repo los trae
       };
    }
  }
}
