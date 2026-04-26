import { IViajeRepository } from '../../domain/viaje.repository';
import { emitirViajeCancelado } from '../../../shared/socket.handler';

export class CancelarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: { viaje_id: string; motivo: string; cancelado_por: 'cliente' | 'conductor' }): Promise<boolean> {
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    // Solo se puede cancelar si no está ya completado o cancelado
    if (['completado', 'cancelado'].includes(viaje.estado)) {
      throw new Error('El viaje ya no puede ser cancelado');
    }

    const exito = await this.viajeRepository.actualizarEstado(dto.viaje_id, 'cancelado');
    
    if (exito && dto.cancelado_por === 'cliente') {
       // 📢 LIMPIEZA DE EVENTOS: Notificar a conductores que el cliente canceló
       emitirViajeCancelado(dto.viaje_id);
    }

    console.log(`[Viaje] ${dto.viaje_id} cancelado por ${dto.cancelado_por}. Motivo: ${dto.motivo}`);
    
    return exito;
  }
}
