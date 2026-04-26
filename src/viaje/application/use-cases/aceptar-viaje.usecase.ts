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
    
    // LOG CRÍTICO para depurar en Railway
    console.log("DATOS CONDUCTOR:", JSON.stringify(conductor, null, 2));

    if (conductor && conductor.ubicacion_actual && conductor.ubicacion_actual.lat) {
      try {
        console.log(`[AceptarViaje] Calculando ruta_recogida desde (${conductor.ubicacion_actual.lat}, ${conductor.ubicacion_actual.lng}) hasta origen cliente`);
        
        // 2. Calcular Ruta Recogida (Conductor -> Origen)
        const mapaRecogida = await this.consultarRutaMapa.execute({
          origen: conductor.ubicacion_actual,
          destino: viaje.origen
        });
        
        // 3. Aplanar GeoJSON
        if (mapaRecogida.geojson?.features) {
          viaje.ruta_recogida = mapaRecogida.geojson.features.flatMap((f: any) => f.geometry.coordinates);
          console.log(`[AceptarViaje] ✅ ruta_recogida calculada y aplanada: ${viaje.ruta_recogida?.length || 0} puntos`);
        } else {
          console.warn(`[AceptarViaje] ⚠️ Maps-API devolvió ruta pero sin coordenadas válidas.`);
        }
      } catch (e) {
        console.error(`[AceptarViaje] ❌ Error calculando ruta recogida:`, e);
      }
    } else {
      console.warn(`[AceptarViaje] ⚠️ No se pudo calcular ruta_recogida: El conductor no tiene GPS activo.`);
    }

    viaje.estado = 'asignado';
    viaje.conductor_id = dto.conductor_id;
    viaje.asignado_at = new Date();

    // Actualizamos el viaje con el nuevo conductor y la ruta de recogida calculada (Usando bloqueo atómico)
    await this.viajeRepository.asignarConductor(viaje.id!, dto.conductor_id, viaje.ruta_recogida || []);

    return viaje;
  }
}
