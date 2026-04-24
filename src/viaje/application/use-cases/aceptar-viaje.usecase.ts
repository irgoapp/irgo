import { AceptarViajeDto } from '../dto/in/aceptar-viaje.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';

export class AceptarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase
  ) {}

  async execute(dto: AceptarViajeDto): Promise<Viaje> {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    
    // Un viaje solo puede ser aceptado si está en estado 'buscando'
    if (viaje.estado !== 'buscando') {
      throw new Error('EL_VIAJE_YA_NO_ESTA_DISPONIBLE');
    }

    // 1. Obtener ubicación del conductor que aceptó
    const conductor = await this.conductorRepository.buscarPorId(dto.conductor_id);
    if (conductor && conductor.ubicacion_actual) {
      try {
        // 2. Calcular Ruta Recogida (Conductor -> Origen)
        const mapaRecogida = await this.consultarRutaMapa.execute({
          origen: conductor.ubicacion_actual,
          destino: viaje.origen
        });
        
        // 3. Aplanar GeoJSON
        if (mapaRecogida.geojson?.features) {
          viaje.ruta_recogida = mapaRecogida.geojson.features.flatMap((f: any) => f.geometry.coordinates);
        }
      } catch (e) {
        console.error(`[AceptarViaje] Error calculando ruta recogida:`, e);
      }
    }

    viaje.estado = 'asignado';
    viaje.conductor_id = dto.conductor_id;
    viaje.asignado_at = new Date();

    // Actualizamos el viaje con el nuevo conductor y la ruta de recogida calculada
    await this.viajeRepository.actualizar(viaje);

    return viaje;
  }
}
