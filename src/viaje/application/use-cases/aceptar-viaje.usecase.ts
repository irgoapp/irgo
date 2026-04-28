import { AceptarViajeDto } from '../dto/in/aceptar-viaje.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { emitirViajeTomado } from '../../../shared/socket.handler';
import { MovimientoService } from '../../../movimiento/application/services/movimiento.service';
import { WhatsappNotificationService } from '../../../whatsapp/application/services/whatsapp-notification.service';
import { supabaseClient } from '../../../shared/supabase.client';
import { ISalaViajeOfertaRepository } from '../../domain/sala-viaje-oferta.repository';

export class AceptarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private whatsappNotification: WhatsappNotificationService,
    private movimientoService: MovimientoService,
    private salaOfertasRepo: ISalaViajeOfertaRepository
  ) { }

  async execute(dto: AceptarViajeDto): Promise<Viaje> {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    // 1. OBTENER ESTADO DE ACEPTACIÓN (Optimizado con RPC)
    const { data: estado, error: errorEstado } = await supabaseClient.rpc('obtener_estado_aceptacion', {
      p_conductor_id: dto.conductor_id,
      p_viaje_id: dto.viaje_id
    });

    if (errorEstado || !estado || estado.length === 0) {
      console.error('[AceptarViaje] Error al obtener estado:', errorEstado);
      throw new Error('No se pudo obtener el estado del conductor o el viaje');
    }

    const info = estado[0];
    
    // 2. VALIDACIÓN DE SALDO
    const montoComision = viaje.monto_comision || 0;
    if (info.conductor_saldo < montoComision) {
      throw new Error('Saldo insuficiente para aceptar este viaje');
    }

    // 3. CÁLCULO DE RUTA DE RECOGIDA
    let rutaRecogida: any[] = [];
    if (info.conductor_lat && info.conductor_lng) {
      try {
        console.log(`[AceptarViaje] Calculando ruta desde (${info.conductor_lat}, ${info.conductor_lng})`);
        const mapaRecogida = await this.consultarRutaMapa.execute({
          origen: { lat: info.conductor_lat, lng: info.conductor_lng },
          destino: { lat: info.cliente_origen_lat, lng: info.cliente_origen_lng }
        });
        if (mapaRecogida.geojson?.features) {
          rutaRecogida = mapaRecogida.geojson.features.flatMap((f: any) => f.geometry.coordinates);
        }
      } catch (e) {
        console.error(`[AceptarViaje] Error calculando ruta:`, e);
      }
    }

    // 4. ASIGNACIÓN ATÓMICA
    const exitoAsignacion = await this.viajeRepository.asignarConductor(viaje.id!, dto.conductor_id, rutaRecogida);

    if (!exitoAsignacion) {
      throw new Error('EL_VIAJE_YA_NO_ESTA_DISPONIBLE');
    }

    // --- ACTUALIZACIÓN DE SALA DE OFERTAS ---
    await this.salaOfertasRepo.actualizarEstado(viaje.id!, 'aceptada', dto.conductor_id);

    // --- LIMPIEZA PARA EL RESTO DE CONDUCTORES ---
    try {
        const sala = await this.salaOfertasRepo.buscarPorViajeId(dto.viaje_id);
        if (sala && sala.enviado_conductores_id.length > 0) {
            // Filtramos al ganador para no cerrarle su propia pantalla
            const otrosConductores = sala.enviado_conductores_id.filter(id => id !== dto.conductor_id);
            console.log(`[AceptarViaje] Limpiando oferta para ${otrosConductores.length} conductores que perdieron`);
            
            for (const condId of otrosConductores) {
                const { emitirLimpiezaDeOferta } = await import('../../../shared/socket.handler');
                emitirLimpiezaDeOferta(condId, viaje.id!);
            }
        }
    } catch (error) {
        console.error(`[AceptarViaje] Error en limpieza de ofertas concurrentes:`, error);
    }

    // 5. COBRO DE COMISIÓN
    try {
      await this.movimientoService.procesarCobroComision(dto.conductor_id, viaje.id!, montoComision);
    } catch (error: any) {
      console.error(`[AceptarViaje] Error en cobro: ${error.message}`);
    }

    // 6. Notificaciones
    emitirViajeTomado(viaje.id!);
    // WhatsApp notification is now handled by the bot's RAMA 2
    // when the client sends a message and the bot detects estado = 'asignado'

    viaje.estado = 'asignado';
    viaje.conductor_id = dto.conductor_id;
    viaje.ruta_recogida = rutaRecogida;
    return viaje;
  }
}
