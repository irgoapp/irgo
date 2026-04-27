import { IWhatsappRepository } from '../../../domain/whatsapp.repository';
import { ISessionRepository, ESTADOS_SESION } from '../../../domain/wsp-session.entity';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';

export class HandleStartUseCase {
  constructor(
    private whatsappRepo: IWhatsappRepository,
    private sessionRepo: ISessionRepository
  ) {}

  /**
   * Envía bienvenida con botones de tipo de vehículo.
   */
  async execute(telefono: string): Promise<void> {
    console.log(`[HandleStart] Enviando bienvenida a ${telefono}`);

    await this.whatsappRepo.enviarMensaje({
      telefono,
      texto: BotResponseBuilder.mensajeBienvenida()
    });

    await this.sessionRepo.upsertSession(telefono, ESTADOS_SESION.INICIO, {});
  }

  /**
   * Cuando el cliente elige Moto/Auto/Delivery, le pedimos la ubicación.
   */
  async seleccionarVehiculo(telefono: string, replyId: string): Promise<void> {
    const mapeo: Record<string, string> = {
      'pedir_moto': 'moto',
      'pedir_auto': 'auto',
      'pedir_delivery': 'delivery'
    };
    const tipo = mapeo[replyId] || 'moto';

    await this.whatsappRepo.enviarMensaje({
      telefono,
      texto: BotResponseBuilder.mensajePedirUbicacion()
    });

    await this.sessionRepo.upsertSession(telefono, ESTADOS_SESION.ESPERANDO_UBICACION, {
      tipo_vehiculo: tipo
    });

    console.log(`[HandleStart] Tipo ${tipo} seleccionado. Esperando ubicación.`);
  }
}
