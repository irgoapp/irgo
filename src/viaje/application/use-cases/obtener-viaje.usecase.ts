import { IViajeRepository } from '../../domain/viaje.repository';
import { ViajeResponseDto } from '../dto/out/viaje-response.dto';

export class ObtenerViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(id: string): Promise<ViajeResponseDto> {
    const viaje = await this.viajeRepository.buscarPorId(id);
    if (!viaje) throw new Error('Viaje no encontrado en el sistema IrGo');
    
    return new ViajeResponseDto(viaje);
  }
}
