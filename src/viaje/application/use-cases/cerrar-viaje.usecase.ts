import { CerrarViajeDto } from '../dto/in/cerrar-viaje.dto';
import { IViajeRepository } from '../../domain/viaje.repository';
import { ISalaViajeOfertaRepository } from '../../domain/sala-viaje-oferta.repository';
import { IClienteRepository } from '../../../cliente/domain/cliente.repository';

export class CerrarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private salaOfertasRepo: ISalaViajeOfertaRepository,
    private clienteRepo: IClienteRepository
  ) {}

  async execute(dto: CerrarViajeDto) {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.conductor_id !== dto.conductor_id) throw new Error('No autorizado');

    viaje.estado = 'completado';
    await this.viajeRepository.actualizarEstado(viaje.id!, 'completado');

    // Marcamos la sala como completada
    await this.salaOfertasRepo.actualizarEstado(viaje.id!, 'completada');

    // 🌟 REDENCIÓN: Limpiamos el historial de cancelaciones tras un viaje exitoso
    try {
        console.log(`[CerrarViaje] Redención exitosa para cliente ${viaje.cliente_id}. Limpiando contador.`);
        await this.clienteRepo.resetearCancelaciones(viaje.cliente_id);
    } catch (error: any) {
        console.error(`[CerrarViaje] Error al resetear cancelaciones:`, error.message);
    }

    return viaje;
  }
}
