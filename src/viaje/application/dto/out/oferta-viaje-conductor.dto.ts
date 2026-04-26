import { Viaje } from '../../../domain/viaje.entity';

/**
 * Este DTO (Data Transfer Object) representa EXACTAMENTE la estructura de datos
 * plana que recibirá el APK del conductor a través de los Sockets cuando
 * le ofrezcamos un viaje entrante.
 */
export class OfertaViajeConductorDto {
  viaje_id: string;

  // Datos Financieros 
  monto_ruta: number;

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
    gananciaPura: number,
    distanciaRutaOrigenADestino: number,
    tiempoRutaOrigenADestino: number,
    puntos_ruta?: any[]
  ) {
    this.viaje_id = viaje.id!;

    // Financiero
    this.monto_ruta = gananciaPura;

    // Distancias y Tiempos
    this.distancia_ruta = distanciaRutaOrigenADestino;
    this.tiempo_ruta = tiempoRutaOrigenADestino;

    // Ruta
    this.puntos_ruta = puntos_ruta;

    // Ubicaciones
    this.origen_lat = viaje.origen.lat;
    this.origen_lng = viaje.origen.lng;
    this.origen_texto = viaje.origen_texto || 'Calle no identificada';

    this.destino_lat = viaje.destino.lat;
    this.destino_lng = viaje.destino.lng;
    this.destino_texto = viaje.destino_texto || 'Destino no identificado';

    // Cliente
    this.cliente_nombre_corto = 'Juan P.';
    this.cliente_calificacion = 4.8;
  }
}
