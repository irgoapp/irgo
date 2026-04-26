import { IWhatsappRepository } from '../domain/whatsapp.repository';
import { BotResponseBuilder } from '../domain/bot-response.builder';
import { Viaje } from '../../viaje/domain/viaje.entity';
import { IConductorRepository } from '../../conductor/domain/conductor.repository';
import { IClienteRepository } from '../../cliente/domain/cliente.repository';

/**
 * WhatsappNotificationService
 * Se encarga de enviar mensajes proactivos al cliente basados en eventos del viaje.
 */
export class WhatsappNotificationService {
  constructor(
    private whatsappRepo: IWhatsappRepository,
    private conductorRepo: IConductorRepository,
    private clienteRepo: IClienteRepository
  ) {}

  /**
   * Notifica al cliente que un conductor ha aceptado el viaje.
   */
  async notificarConductorAsignado(viaje: Viaje): Promise<void> {
    if (!viaje.conductor_id || !viaje.cliente_id) return;

    try {
      const [conductor, cliente] = await Promise.all([
        this.conductorRepo.buscarPorId(viaje.conductor_id),
        this.clienteRepo.buscarPorId(viaje.cliente_id)
      ]);

      if (!cliente || !conductor) {
        console.warn(`[WspNotif] No se pudo notificar asignación: Cliente o Conductor no encontrados.`);
        return;
      }

      // El PIN son los últimos 2 dígitos del teléfono del cliente (Regla de negocio IrGo)
      const pin = cliente.telefono.replace(/\D/g, '').slice(-2).padStart(2, '0');

      const mensaje = BotResponseBuilder.mensajeConductorAsignado({
        conductor,
        etaMinutos: 5, // Valor base, podría calcularse dinámicamente en el futuro
        pin
      });

      await this.whatsappRepo.enviarMensaje({
        telefono: cliente.telefono,
        texto: mensaje
      });

      console.log(`[WspNotif] ✅ Notificación de ASIGNADO enviada a ${cliente.telefono}`);
    } catch (error: any) {
      console.error(`[WspNotif] ❌ Error notificando asignación:`, error.message);
    }
  }

  /**
   * Notifica al cliente que el conductor ha llegado al punto de recogida.
   */
  async notificarConductorLlegado(viaje: Viaje): Promise<void> {
    if (!viaje.cliente_id) return;

    try {
      const cliente = await this.clienteRepo.buscarPorId(viaje.cliente_id);
      if (!cliente) return;

      const mensaje = BotResponseBuilder.mensajeConductorLlegado();

      await this.whatsappRepo.enviarMensaje({
        telefono: cliente.telefono,
        texto: mensaje
      });

      console.log(`[WspNotif] ✅ Notificación de LLEGADA enviada a ${cliente.telefono}`);
    } catch (error: any) {
      console.error(`[WspNotif] ❌ Error notificando llegada:`, error.message);
    }
  }
}
