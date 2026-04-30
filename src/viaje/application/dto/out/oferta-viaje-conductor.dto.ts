import { Viaje } from '../../../domain/viaje.entity';

/**
 * Este DTO (Data Transfer Object) representa EXACTAMENTE la estructura de datos
 * plana que recibirá el APK del conductor a través de los Sockets cuando
 * le ofrezcamos un viaje entrante.
 */
export class OfertaViajeConductorDto {
  viaje_id: string;
  cliente_id: string;

  // Datos Financieros 
  monto_ruta: number;      // Lo que paga el cliente
  monto_conductor: number; // Lo que gana el chofer neto

  // Datos Logísticos
  distancia_ruta: number;
  tiempo_ruta: number;

  // Ubicaciones puras 
  origen_lat: number;
  origen_lng: number;
  origen_texto: string;
  destino_lat: number;
  destino_lng: number;
  destino_texto: string;

  // Dibujo Polyline Cartográfica (Array de coordenadas)
  puntos_ruta?: any[];

  // Datos de confianza del cliente
  cliente_nombre_corto: string;
  cliente_calificacion: number;

  constructor(
    viaje: Viaje,
    montoConductor: number,
    distanciaRuta: number,
    tiempoRuta: number,
    puntos_ruta?: any[]
  ) {
    this.viaje_id = viaje.id!;
    this.cliente_id = viaje.cliente_id;

    // Financiero
    this.monto_ruta = viaje.monto_ruta || 0;
    this.monto_conductor = montoConductor;

    // Distancias y Tiempos
    this.distancia_ruta = distanciaRuta;
    this.tiempo_ruta = tiempoRuta;

    // Ruta
    this.puntos_ruta = puntos_ruta;

    // Ubicaciones
    this.origen_lat = viaje.origen.lat;
    this.origen_lng = viaje.origen.lng;
    this.origen_texto = viaje.origen_texto || 'Calle no identificada';

    this.destino_lat = viaje.destino.lat;
    this.destino_lng = viaje.destino.lng;
    this.destino_texto = viaje.destino_texto || 'Destino no identificado';

    // Cliente (Datos reales desde el objeto cargado en el repo)
    this.cliente_nombre_corto = viaje.cliente?.nombre || 'Cliente IrGo';
    this.cliente_calificacion = viaje.cliente?.calificacion || 5.0;
  }
}
