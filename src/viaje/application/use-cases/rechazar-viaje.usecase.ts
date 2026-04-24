import { IViajeRepository } from '../../domain/viaje.repository';

export class RechazarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: { viaje_id: string; conductor_id: string }) {
    // Lógica para registrar el rechazo en base de datos e iterar motor de asignaciones
    return { status: 'rechazado' };
  }
}
