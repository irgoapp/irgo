import { ISessionRepository, ESTADOS_SESION } from '../../domain/wsp-session.entity';
import { IViajeLookupRepository } from '../../domain/viaje-lookup.repository';
import { HandleStartUseCase } from './estados/handle-start.usecase';
import { HandleLocationUseCase } from './estados/handle-location.usecase';
import { HandleConfirmationUseCase } from './estados/handle-confirmation.usecase';
import { HandleViajeActivoUseCase } from './estados/handle-viaje-activo.usecase';

/**
 * BotMachineUseCase — Cerebro del bot de WhatsApp.
 *
 * RAMA 1: Cliente SIN viaje activo → Flujo de creación (wsp_sessions).
 * RAMA 2: Cliente CON viaje activo → Respuesta según solicitudes.estado.
 */
export class BotMachineUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private viajeLookupRepo: IViajeLookupRepository,
    private handleStart: HandleStartUseCase,
    private handleLocation: HandleLocationUseCase,
    private handleConfirmation: HandleConfirmationUseCase,
    private handleViajeActivo: HandleViajeActivoUseCase
  ) {}

  async execute(
    telefono: string,
    clienteId: string | null,
    message: { type: string; replyId?: string; lat?: number; lng?: number; body?: string }
  ): Promise<void> {
    console.log(`[BotMachine] Tel: ${telefono} | ClienteId: ${clienteId || 'nuevo'}`);

    // ═══════════════════════════════════════════════
    // PASO A/B/C: ¿Tiene viaje activo en solicitudes?
    // ═══════════════════════════════════════════════
    if (clienteId) {
      const viajeActivo = await this.viajeLookupRepo.buscarViajeActivoPorCliente(clienteId);

      if (viajeActivo) {
        // RAMA 2: Viaje activo → La fuente de verdad es solicitudes.estado
        console.log(`[BotMachine] RAMA 2 → Viaje activo ${viajeActivo.id} (${viajeActivo.estado})`);
        await this.handleViajeActivo.execute(telefono, viajeActivo, message);
        return;
      }
    }

    // ═══════════════════════════════════════════════
    // RAMA 1: Sin viaje activo → Flujo de creación
    // ═══════════════════════════════════════════════
    let session = await this.sessionRepo.getSession(telefono);

    // Verificación de Expiración (10 minutos)
    if (session) {
      const now = new Date();
      const lastActive = new Date(session.ultima_actividad || now);
      const diffMinutes = (now.getTime() - lastActive.getTime()) / 60000;

      if (diffMinutes > 10) {
        console.log(`[BotMachine] Sesión expirada (${diffMinutes.toFixed(1)} min). Reiniciando.`);
        session = null;
      }
    }

    // Si no hay sesión o dice "hola", reiniciamos
    if (!session || message.body?.toLowerCase() === 'hola') {
      console.log(`[BotMachine] RAMA 1 → Inicio para ${telefono}`);
      await this.handleStart.execute(telefono);
      return;
    }

    // Router por botones interactivos
    if (message.replyId) {
      await this.routearBoton(session, telefono, message.replyId);
      return;
    }

    // Router por estado de sesión
    switch (session.estado) {
      case ESTADOS_SESION.INICIO:
      case ESTADOS_SESION.ESPERANDO_UBICACION:
        if (message.type === 'location' && message.lat && message.lng) {
          await this.handleLocation.execute(session, message.lat, message.lng);
        } else {
          await this.handleStart.execute(telefono);
        }
        break;

      default:
        console.log(`[BotMachine] Estado desconocido: ${session.estado}. Reiniciando.`);
        await this.handleStart.execute(telefono);
        break;
    }
  }

  /**
   * Sub-router para respuestas de botones interactivos.
   */
  private async routearBoton(session: any, telefono: string, replyId: string): Promise<void> {
    // Botones de tipo de vehículo → pedir ubicación
    if (replyId === 'pedir_moto' || replyId === 'pedir_auto' || replyId === 'pedir_delivery') {
      await this.handleStart.seleccionarVehiculo(telefono, replyId);
      return;
    }

    // Botones de confirmación de viaje
    if (replyId === 'confirmar_si' || replyId === 'confirmar_no' || replyId === 'cancelar') {
      await this.handleConfirmation.execute(session, replyId);
      return;
    }

    // Botón no reconocido → reiniciar
    console.warn(`[BotMachine] Botón no reconocido: ${replyId}`);
    await this.sessionRepo.upsertSession(telefono, ESTADOS_SESION.INICIO, {});
    await this.handleStart.execute(telefono);
  }
}
