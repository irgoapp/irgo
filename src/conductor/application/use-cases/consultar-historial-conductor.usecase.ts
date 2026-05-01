import { IViajeRepository } from '../../../viaje/domain/viaje.repository';

export class ConsultarHistorialConductorUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(conductorId: string, filtro?: string): Promise<{ metricas: any, historial: any[] }> {
    if (!conductorId) throw new Error('Conductor ID requerido');

    let inicio: string | undefined;
    let fin: string | undefined;

    if (filtro && filtro !== 'todos') {
        const now = new Date();
        fin = now.toISOString();

        if (filtro === 'hoy') {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            inicio = d.toISOString();
        } else if (filtro === 'semana') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            inicio = d.toISOString();
        } else if (filtro === 'mes') {
            const d = new Date();
            d.setMonth(d.getMonth() - 1);
            inicio = d.toISOString();
        }
    }

    return await this.viajeRepository.obtenerHistorial(conductorId, { inicio, fin });
  }
}
