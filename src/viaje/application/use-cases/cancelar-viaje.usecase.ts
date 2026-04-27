import { MovimientoService } from '../../../movimiento/application/services/movimiento.service';

export class CancelarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private movimientoService: MovimientoService
  ) {}

  async execute(dto: { viaje_id: string; motivo: string; cancelado_por: 'cliente' | 'conductor' }): Promise<boolean> {
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    // Solo se puede cancelar si no está ya completado o cancelado
    if (['completado', 'cancelado'].includes(viaje.estado)) {
      throw new Error('El viaje ya no puede ser cancelado');
    }

    const exito = await this.viajeRepository.actualizarEstado(dto.viaje_id, 'cancelado');
    
    // REEMBOLSO: Si el viaje tenía un conductor asignado, devolvemos la comisión
    if (exito && viaje.conductor_id) {
       console.log(`[CancelarViaje] Reembolsando comisión a conductor ${viaje.conductor_id} por cancelación del viaje ${viaje.id}`);
       await this.movimientoService.procesarReembolsoComision(viaje.conductor_id, viaje.id!);
    }

    if (exito && dto.cancelado_por === 'cliente') {
       // 📢 LIMPIEZA DE EVENTOS: Notificar a conductores que el cliente canceló
       emitirViajeCancelado(dto.viaje_id);
    }

    console.log(`[Viaje] ${dto.viaje_id} cancelado por ${dto.cancelado_por}. Motivo: ${dto.motivo}`);
    
    return exito;
  }
}
