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
  conductores?: any;
  buscando_at?: string;
  asignado_at?: string;
  llegado_at?: string;
  iniciado_at?: string;
  completado_at?: string;
  cancelado_at?: string;
  ruta?: any[];
  ruta_recogida?: any[];
  tiempo_minutos: number;

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
    this.buscando_at = viaje.buscando_at?.toISOString();
    this.asignado_at = viaje.asignado_at?.toISOString();
    this.llegado_at = viaje.llegado_at?.toISOString();
    this.iniciado_at = viaje.iniciado_at?.toISOString();
    this.completado_at = viaje.completado_at?.toISOString();
    this.cancelado_at = viaje.cancelado_at?.toISOString();
    this.ruta = viaje.ruta;
    this.ruta_recogida = viaje.ruta_recogida;
    this.tiempo_minutos = viaje.tiempo_minutos || 0;
    
    // Si hay conductor, preparamos el objeto anidado que busca el frontend
    if (viaje.conductor_id) {
       this.conductores = {
         id: viaje.conductor_id
       };
    }
  }
}
