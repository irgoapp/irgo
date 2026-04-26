import { IWhatsappRepository } from '../../../domain/whatsapp.repository';
import { ISessionRepository, SesionWhatsApp } from '../../../domain/wsp-session.entity';
import { IClienteRepository } from '../../../../cliente/domain/cliente.repository';
import { GetOrCreateClienteUseCase } from '../../../../cliente/application/use-cases/get-or-create-cliente.usecase';
import { IniciarBorradorViajeUseCase } from '../../../../viaje/application/use-cases/iniciar-borrador-viaje.usecase';
import { IniciarViajeInDto } from '../../../../viaje/application/dto/in/iniciar-viaje.in.dto';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';

export class HandleLocationUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private whatsappRepo: IWhatsappRepository,
    private clienteRepo: IClienteRepository,
    private iniciarBorradorViajeUseCase: IniciarBorradorViajeUseCase
  ) {}

  async execute(session: SesionWhatsApp, lat: number, lng: number): Promise<void> {
    const creator = new GetOrCreateClienteUseCase(this.clienteRepo);
    const cliente = await creator.execute({ telefono: session.telefono });

    // Cuando el usuario manda loc, creamos BÓRRADOR en viaje sin despertar a los carros
    try {
      const tipoVehiculo = session.contexto?.tipo_vehiculo || 'moto'; // Fallback a moto por seguridad
      
      const inputDto = new IniciarViajeInDto({
        cliente_id: cliente.id!,
        origen: { lat, lng },
        tipo_vehiculo: tipoVehiculo
      });

      const viajeOut = await this.iniciarBorradorViajeUseCase.execute(inputDto);
      
      // Obtenemos la URL del FRONTEND (Cliente) para el link de WhatsApp
      const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://taxlibre-cliente.pages.dev';
      const link = `${baseUrl}/viaje/${viajeOut.viaje_id}`;
      
      await this.whatsappRepo.enviarMensaje({
        telefono: session.telefono,
        texto: BotResponseBuilder.mensajeLinkDestino(link)
      });

      // Actualizar sesión pidiendo destino
      await this.sessionRepo.upsertSession(session.telefono, 'SEARCHING_DRIVER', {
        ...session.contexto,
        origenLat: lat,
        origenLng: lng,
        solicitud_id: viajeOut.viaje_id
      });

    } catch (e: any) {
      console.error('[HandleLocation] Error pidiendo viaje cruzado:', e.message);
    }
  }
}
