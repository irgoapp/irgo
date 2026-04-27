import { AceptarViajeDto } from '../dto/in/aceptar-viaje.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { emitirViajeTomado } from '../../../shared/socket.handler';
import { MovimientoService } from '../../../movimiento/application/services/movimiento.service';
import { WhatsappNotificationService } from '../../../whatsapp/application/services/whatsapp-notification.service';

export class AceptarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private whatsappNotification: WhatsappNotificationService,
    private movimientoService: MovimientoService
  ) {}

  async execute(dto: AceptarViajeDto): Promise<Viaje> {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    
    // 1. Obtener ubicación del conductor que aceptó
    const conductor = await this.conductorRepository.buscarPorId(dto.conductor_id);
    let rutaRecogida: any[] = [];

    if (conductor && conductor.ubicacion_actual && conductor.ubicacion_actual.lat) {
      try {
        console.log(`[AceptarViaje] Calculando ruta_recogida desde (${conductor.ubicacion_actual.lat}, ${conductor.ubicacion_actual.lng}) hasta origen cliente`);
        const mapaRecogida = await this.consultarRutaMapa.execute({
          origen: conductor.ubicacion_actual,
          destino: viaje.origen
        });
        if (mapaRecogida.geojson?.features) {
          rutaRecogida = mapaRecogida.geojson.features.flatMap((f: any) => f.geometry.coordinates);
        }
      } catch (e) {
        console.error(`[AceptarViaje] ❌ Error calculando ruta recogida:`, e);
      }
    }

    // 2. ASIGNACIÓN ATÓMICA (Intentar ganar el viaje)
    // Solo se asignará si el estado sigue siendo 'buscando' (bloqueo en base de datos)
    const exitoAsignacion = await this.viajeRepository.asignarConductor(viaje.id!, dto.conductor_id, rutaRecogida);

    if (!exitoAsignacion) {
      throw new Error('EL_VIAJE_YA_NO_ESTA_DISPONIBLE');
    }

    // 2. COBRO DE COMISIÓN (Solo si ya ganamos el viaje)
    try {
      const montoComision = viaje.monto_comision || 0;
      await this.movimientoService.procesarCobroComision(dto.conductor_id, viaje.id!, montoComision);
    } catch (error: any) {
      // Si falla el cobro (ej: se quedó sin saldo en ese instante), 
      // opcionalmente podríamos revertir la asignación, pero por ahora lo dejamos asignado 
      // y lanzamos el error para que el driver sepa que debe recargar.
      console.error(`[AceptarViaje] Error en cobro tras asignación: ${error.message}`);
      throw error;
    }

    // 3. Notificaciones
    emitirViajeTomado(viaje.id!);
    this.whatsappNotification.notificarConductorAsignado(viaje);

    viaje.estado = 'asignado';
    viaje.conductor_id = dto.conductor_id;
    return viaje;
  }
}
