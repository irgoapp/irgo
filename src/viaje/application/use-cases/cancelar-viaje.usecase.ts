import { IViajeRepository } from '../../domain/viaje.repository';

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
    
    console.log(`[Viaje] ${dto.viaje_id} cancelado por ${dto.cancelado_por}. Motivo: ${dto.motivo}`);
    
    return exito;
  }
}
