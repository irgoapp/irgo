import { SalaViajeOferta } from './sala-viaje-oferta.entity';

export interface ISalaViajeOfertaRepository {
  crear(sala: SalaViajeOferta): Promise<SalaViajeOferta>;
  buscarPorViajeId(viajeId: string): Promise<SalaViajeOferta | null>;
  actualizarEstado(viajeId: string, estado: SalaViajeOferta['estado_oferta'], conductorId?: string): Promise<boolean>;
  agregarConductores(viajeId: string, conductoresIds: string[]): Promise<boolean>;
}
