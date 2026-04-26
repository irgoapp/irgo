import { IMapaRepository } from '../../domain/mapa.repository';
import { Mapa } from '../../domain/mapa.entity';

export class ConsultarRutaMapaUseCase {
  constructor(private mapaRepository: IMapaRepository) {}

  async execute(dto: { origen: { lat: number, lng: number }, destino: { lat: number, lng: number } }): Promise<Mapa> {
    if (!dto.origen.lat || !dto.destino.lat) throw new Error('Coordenadas requeridas');
    return await this.mapaRepository.calcularRuta(dto.origen, dto.destino);
  }
}
