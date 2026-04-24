import { IViajeRepository } from '../../domain/viaje.repository';

export class CalificarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: { viaje_id: string; rating: number }): Promise<boolean> {
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    // En un sistema real, actualizaríamos la calificación en Supabase
    // Por ahora, simulamos el éxito y logueamos. 
    // TODO: Implementar persistencia de calificación en el repositorio.
    console.log(`[Calificación] Viaje ${dto.viaje_id} calificado con ${dto.rating} estrellas.`);

    return true;
  }
}
