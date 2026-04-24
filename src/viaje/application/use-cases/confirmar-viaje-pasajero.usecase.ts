import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { emitirOfertaViaje } from '../../../shared/socket.handler';
import { OfertaViajeConductorDto } from '../dto/out/oferta-viaje-conductor.dto';
import { ConfirmarViajeDto } from '../dto/in/confirmar-viaje.dto';
import { ViajeResponseDto } from '../dto/out/viaje-response.dto';

export class ConfirmarViajePasajeroUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository
  ) {}

  async execute(dto: ConfirmarViajeDto): Promise<ViajeResponseDto> {
    dto.validar();
    
    // 1. Buscamos el viaje borrador
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.estado !== 'borrador') throw new Error('El viaje ya no es un borrador');

    // 2. Actualizamos con los datos finales del cliente
    viaje.destino = { lat: dto.destino_lat, lon: dto.destino_lng };
    viaje.destino_texto = dto.destino_texto;
    viaje.precio = dto.monto;
    viaje.distancia_km = dto.distancia_km;
    viaje.estado = 'buscando';
    viaje.buscando_at = new Date();

    const actualizado = await this.viajeRepository.actualizar(viaje);
    
    // 3. DISPARAR MOTOR DE EMPAREJAMIENTO (Matching Engine) EN SEGUNDO PLANO
    this.iniciarBusquedaPorRondas(actualizado.id!);

    return new ViajeResponseDto(actualizado);
  }

  private async iniciarBusquedaPorRondas(viajeId: string) {
    console.log(`[MatchingEngine] Iniciando rondas para viaje: ${viajeId}`);

    // RONDA 1: Los 5 más cercanos
    await this.ejecutarRonda(viajeId, 5, 0);

    // ESPERA 10 SEGUNDOS
    setTimeout(async () => {
      // RONDA 2: Los siguientes 10
      await this.ejecutarRonda(viajeId, 10, 5);
    }, 10000);
  }

  private async ejecutarRonda(viajeId: string, limite: number, offset: number) {
    const viaje = await this.viajeRepository.buscarPorId(viajeId);
    
    // Si ya no está buscando (ej. alguien aceptó), cancelamos la ronda
    if (!viaje || viaje.estado !== 'buscando') {
      console.log(`[MatchingEngine] Viaje ${viajeId} ya no está buscando. Ronda cancelada.`);
      return;
    }

    console.log(`[MatchingEngine] Ronda (L:${limite}, O:${offset}) para viaje ${viajeId}`);

    const conductores = await this.conductorRepository.buscarCercanosDisponibles(
      viaje.origen.lat,
      viaje.origen.lon,
      3, // Radio 3km
      viaje.tipo_vehiculo,
      limite,
      offset
    );

    for (const cond of conductores) {
      if (!cond.id) continue;
      
      const oferta = new OfertaViajeConductorDto(
        viaje,
        0.5, // Distancia ficticia por ahora
        2,   // Tiempo ficticio por ahora
        Number((viaje.precio! * 0.85).toFixed(2)), // 15% Comisión IrGo
        viaje.distancia_km || 0,
        10 // Tiempo ruta ficticio
      );

      emitirOfertaViaje(cond.id, oferta);
    }
  }
}
