import { Viaje } from '../../../domain/viaje.entity';

/**
 * Este DTO (Data Transfer Object) representa EXACTAMENTE la estructura de datos
 * plana que recibirá el APK del conductor a través de los Sockets cuando
 * le ofrezcamos un viaje entrante.
 */
export class OfertaViajeConductorDto {
  viaje_id: string;
  tiempo_expiracion_segundos: number;
  
  // Datos Financieros 
  monto: number;

  // Datos Logísticos
  distancia_conductor_a_origen: number;
  tiempo_conductor_a_origen: number;
  distancia_ruta: number;
  tiempo_ruta: number;

  // Ubicaciones puras 
  origen_lat: number;
  origen_lon: number;
  origen_texto: string;
  destino_lat: number;
  destino_lon: number;
  destino_texto: string;
  
  // Dibujo Polyline Cartográfica
  ruta?: any[];

  // Datos de confianza del cliente
  cliente_nombre_corto: string;
  cliente_calificacion: number;

  constructor(
    viaje: Viaje,
    distanciaConductorAlPasajero: number,
    tiempoConductorAlPasajero: number,
    gananciaPura: number,
    distanciaRutaOrigenADestino: number,
    tiempoRutaOrigenADestino: number
  ) {
    this.viaje_id = viaje.id!;
    this.tiempo_expiracion_segundos = 15; // Tiempo estándar de plataforma The Uber/DiDi
    
    // Financiero
    this.monto = gananciaPura;

    // Distancias y Tiempos
    this.distancia_conductor_a_origen = distanciaConductorAlPasajero;
    this.tiempo_conductor_a_origen = tiempoConductorAlPasajero;
    this.distancia_ruta = distanciaRutaOrigenADestino; 
    this.tiempo_ruta = tiempoRutaOrigenADestino;
    
    // Ubicaciones
    this.origen_lat = viaje.origen.lat;
    this.origen_lon = viaje.origen.lon;
    this.origen_texto = 'Av. Principal (Por definir)'; 
    
    this.destino_lat = viaje.destino.lat;
    this.destino_lon = viaje.destino.lon;
    this.destino_texto = 'Destino Fijo (Por definir)';

    // Cliente
    this.cliente_nombre_corto = 'Juan P.'; 
    this.cliente_calificacion = 4.8;
  }
}
