import { IViajeRepository } from '../../domain/viaje.repository';
import { emitirViajeCancelado, emitirLimpiezaDeOferta } from '../../../shared/socket.handler';
import { MovimientoService } from '../../../movimiento/application/services/movimiento.service';
import { IClienteRepository } from '../../../cliente/domain/cliente.repository';
import { ISessionRepository, ESTADOS_SESION } from '../../../whatsapp/domain/wsp-session.entity';
import { ISalaViajeOfertaRepository } from '../../domain/sala-viaje-oferta.repository';

export class CancelarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private movimientoService: MovimientoService,
    private clienteRepo: IClienteRepository,
    private sessionRepo: ISessionRepository,
    private salaOfertasRepo: ISalaViajeOfertaRepository
  ) {}

  async execute(dto: { viaje_id: string; motivo: string; cancelado_por: 'cliente' | 'conductor' }): Promise<boolean> {
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    // Solo se puede cancelar si no está ya completado o cancelado
    if (['completado', 'cancelado'].includes(viaje.estado)) {
      throw new Error('El viaje ya no puede ser cancelado');
    }

    // Mapeamos el "cancelado_por" para que sea más descriptivo si es cliente
    const canceladoPorLabel = dto.cancelado_por === 'cliente' ? 'cancelado por cliente' : 'cancelado por conductor';

    const exito = await this.viajeRepository.actualizarEstado(dto.viaje_id, 'cancelado', {
        cancelado_por: canceladoPorLabel,
        cancelado_motivo: dto.motivo
    });
    
    // REEMBOLSO: Si el viaje tenía un conductor asignado, devolvemos la comisión
    if (exito && viaje.conductor_id) {
       console.log(`[CancelarViaje] Reembolsando comisión a conductor ${viaje.conductor_id} por cancelación del viaje ${viaje.id}`);
       await this.movimientoService.procesarReembolsoComision(viaje.conductor_id, viaje.id!);
    }

    // --- LIMPIEZA DE SALA DE OFERTAS Y NOTIFICACIÓN A CONDUCTORES ---
    if (exito) {
        try {
            const sala = await this.salaOfertasRepo.buscarPorViajeId(dto.viaje_id);
            if (sala && sala.enviado_conductores_id.length > 0) {
                console.log(`[CancelarViaje] Notificando limpieza a ${sala.enviado_conductores_id.length} conductores`);
                
                // Notificamos a cada conductor que recibió la oferta
                for (const condId of sala.enviado_conductores_id) {
                    emitirLimpiezaDeOferta(condId, dto.viaje_id);
                }
                
                // Marcamos la sala como cancelada
                await this.salaOfertasRepo.actualizarEstado(dto.viaje_id, 'cancelada');
            }
        } catch (error) {
            console.error(`[CancelarViaje] Error limpiando sala de ofertas:`, error);
        }
    }

    // SINCRONIZACIÓN WHATSAPP: Si el viaje fue cancelado, debemos cerrar la sesión de WhatsApp si existe
    if (exito) {
        try {
            const cliente = await this.clienteRepo.buscarPorId(viaje.cliente_id);
            if (cliente?.telefono) {
                console.log(`[CancelarViaje] Sincronizando cancelación con WhatsApp para ${cliente.telefono}`);
                await this.sessionRepo.upsertSession(
                    cliente.telefono, 
                    ESTADOS_SESION.CANCELADO, 
                    {}, 
                    new Date().toISOString()
                );
            }
        } catch (error) {
            console.error(`[CancelarViaje] Error sincronizando sesión de WhatsApp:`, error);
        }
    }

    if (exito && dto.cancelado_por === 'cliente') {
       // 📢 LIMPIEZA DE EVENTOS: Notificar a conductores que el cliente canceló
       emitirViajeCancelado(dto.viaje_id);
    }

    console.log(`[Viaje] ${dto.viaje_id} cancelado por ${dto.cancelado_por}. Motivo: ${dto.motivo}`);
    
    return exito;
  }
}
