import { IWhatsappRepository } from '../../../domain/whatsapp.repository';
import { ISessionRepository, SesionWhatsApp, ESTADOS_SESION } from '../../../domain/wsp-session.entity';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';

/**
 * HandleLocationUseCase
 * Recibe GPS del cliente, crea borrador de viaje y envía link del mapa.
 * Recibe el UseCase de borrador por inyección (no importa de otro dominio).
 */
export class HandleLocationUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private whatsappRepo: IWhatsappRepository,
    private iniciarBorradorViaje: any // Inyectado desde el Controller
  ) {}

  async execute(session: SesionWhatsApp, lat: number, lng: number): Promise<void> {
    try {
      const tipoVehiculo = session.contexto?.tipo_vehiculo || 'moto';

      const viajeOut = await this.iniciarBorradorViaje.execute({
        cliente_id: '', // Se resuelve internamente por el UseCase de viaje
        origen: { lat, lng },
        tipo_vehiculo: tipoVehiculo
      });

      const baseUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://taxlibre-cliente.pages.dev';
      const link = `${baseUrl}/viaje/${viajeOut.viaje_id}`;

      await this.whatsappRepo.enviarMensaje({
        telefono: session.telefono,
        texto: BotResponseBuilder.mensajeLinkDestino(link)
      });

      await this.sessionRepo.upsertSession(session.telefono, ESTADOS_SESION.ESPERANDO_DESTINO, {
        ...session.contexto,
        origenLat: lat,
        origenLng: lng,
        solicitud_id: viajeOut.viaje_id
      });

      console.log(`[HandleLocation] Link enviado. Esperando destino.`);
    } catch (e: any) {
      console.error('[HandleLocation] Error:', e.message);
    }
  }
}
