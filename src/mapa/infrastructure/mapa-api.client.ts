import { IMapaRepository } from '../domain/mapa.repository';
import { Mapa } from '../domain/mapa.entity';

export class MapaApiClient implements IMapaRepository {
  // Usamos el nombre exacto de la variable que pusiste en Railway
  private apiUrl = process.env.MAPS_API_URL || process.env.NEXT_PUBLIC_MAPS_API_URL || 'taxi-libre-production.up.railway.app';

  async calcularRuta(origen: { lat: number, lon: number }, destino: { lat: number, lon: number }): Promise<Mapa> {
    try {
      const host = this.apiUrl.startsWith('http') ? this.apiUrl : `https://${this.apiUrl}`;
      const url = `${host}/api/rutas/calcular`;

      console.log(`[MapaApiClient] Consultando Ruta Oficial en: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: origen.lat, lng: origen.lon },
          destination: { lat: destino.lat, lng: destino.lon },
          vehicleType: 'moto'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error en el servidor de mapas (${response.status}) al llamar a: ${url}`);
      }

      const data = await response.json();
      
      return new Mapa({
        origen,
        destino,
        distancia_km: data.distanceKm || 0,
        tiempo_minutos: data.durationMin || 0,
        geojson: data.geojson
      });

    } catch (e: any) {
      console.error('[MapaApiClient] Error al conectar con el servidor de mapas:', e.message);
      if (e.message.includes('502')) {
        throw new Error('El Microservicio de Mapas está temporalmente fuera de servicio (502). Verifica el despliegue en Railway.');
      }
      throw new Error('Error de conexión con Mapas: ' + e.message);
    }
  }
}
