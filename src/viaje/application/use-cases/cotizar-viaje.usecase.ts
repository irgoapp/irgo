import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { CalcularClientePrecioUseCase } from '../../../precio/application/use-cases/calcular-cliente-precio.usecase';

export class CotizarViajeUseCase {
  constructor(
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private calcularPrecio: CalcularClientePrecioUseCase
  ) {}

  async execute(dto: {
    origen: { lat: number; lng: number };
    destino: { lat: number; lng: number };
    tipo_vehiculo?: string;
  }) {
    // 1. Obtener la ruta topográfica real (distancia y geojson)
    const mapa = await this.consultarRutaMapa.execute({
      origen: dto.origen,
      destino: dto.destino
    });

    // 2. Calcular el precio oficial de la plataforma
    const precio = await this.calcularPrecio.execute({
      distancia_km: mapa.distancia_km,
      tipo_vehiculo: dto.tipo_vehiculo || 'moto'
    });

    // 3. Empacar todo para el cliente (mismo formato que antes pero centralizado)
    return {
      monto_ruta: precio,
      distancia_ruta: mapa.distancia_km,
      tiempo_ruta: mapa.tiempo_ruta,
      ruta: mapa.geojson // El gusano de puntos GPS para dibujar en la Web/App
    };
  }
}
