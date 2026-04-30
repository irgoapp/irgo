import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

// Repositorios (Infraestructura)
import { WhatsappMetaClient } from '../infrastructure/whatsapp-meta.client';
import { SupabaseWspSessionRepository } from '../infrastructure/supabase-wsp-session.repository';
import { SupabaseViajeLookupRepository } from '../infrastructure/supabase-viaje-lookup.repository';
import { SupabaseViajeMensajesRepository } from '../infrastructure/supabase-viaje-mensajes.repository';
import { SupabaseClienteRepository } from '../../cliente/infrastructure/supabase-cliente.repository';
import { SupabaseViajeRepository } from '../../viaje/infrastructure/supabase-viaje.repository';

// Use Cases
import { BotMachineUseCase } from '../application/use-cases/bot-machine.usecase';
import { HandleStartUseCase } from '../application/use-cases/estados/handle-start.usecase';
import { HandleLocationUseCase } from '../application/use-cases/estados/handle-location.usecase';
import { HandleConfirmationUseCase } from '../application/use-cases/estados/handle-confirmation.usecase';
import { HandleViajeActivoUseCase } from '../application/use-cases/estados/handle-viaje-activo.usecase';
import { HandleChatClienteUseCase } from '../application/use-cases/estados/handle-chat-cliente.usecase';
import { IniciarBorradorViajeUseCase } from '../../viaje/application/use-cases/iniciar-borrador-viaje.usecase';
import { GetOrCreateClienteUseCase } from '../../cliente/application/use-cases/get-or-create-cliente.usecase';
import { WhatsappNotificationService } from '../application/services/whatsapp-notification.service';

// DTOs
import { ProcesarWebhookDto } from '../application/dto/in/procesar-webhook.dto';
import { WhatsappResponseDto } from '../application/dto/out/whatsapp-response.dto';

// ═══════════════════════════════════════════════
// Inyección de Dependencias
// ═══════════════════════════════════════════════
const whatsappRepo = new WhatsappMetaClient();
const sessionRepo = new SupabaseWspSessionRepository();
const viajeLookupRepo = new SupabaseViajeLookupRepository();
const mensajesRepo = new SupabaseViajeMensajesRepository();
const clienteRepo = new SupabaseClienteRepository();
const viajeRepo = new SupabaseViajeRepository();

// Use Cases auxiliares (de otros dominios, inyectados aquí)
const getOrCreateCliente = new GetOrCreateClienteUseCase(clienteRepo);
const iniciarBorrador = new IniciarBorradorViajeUseCase(viajeRepo, clienteRepo);

// Use Cases de WhatsApp
const handleStart = new HandleStartUseCase(whatsappRepo, sessionRepo);
const handleLocation = new HandleLocationUseCase(sessionRepo, whatsappRepo, iniciarBorrador);
const handleConfirm = new HandleConfirmationUseCase(whatsappRepo, sessionRepo);
const handleChat = new HandleChatClienteUseCase(mensajesRepo, whatsappRepo);
const handleViajeActivo = new HandleViajeActivoUseCase(whatsappRepo, handleChat);

// El Cerebro
const botMachine = new BotMachineUseCase(
  sessionRepo,
  viajeLookupRepo,
  handleStart,
  handleLocation,
  handleConfirm,
  handleViajeActivo
);

// Servicio de notificaciones (para uso externo desde otros dominios)
export const whatsappNotificationService = new WhatsappNotificationService(whatsappRepo);

export async function whatsappControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {

  // Verificación de Meta Webhook
  fastify.get('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'irgo_connect_secret';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[Meta Webhook] Verificado con éxito.');
      return reply.code(200).send(challenge);
    }
    console.warn('[Meta Webhook] Intento de verificación fallido.');
    return reply.code(403).send('Forbidden');
  });

  // Recepción de mensajes de WhatsApp
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dto = new ProcesarWebhookDto(request.body);
      dto.validar();

      if (dto.type === 'status_update') {
        return reply.code(200).send(new WhatsappResponseDto());
      }

      console.log(`[Webhook] Tel: ${dto.telefono} | Tipo: ${dto.type} | ID: ${dto.messageId}`);

      // Marcar como leído (delivery de Meta)
      if (dto.messageId) {
        await whatsappRepo.marcarLeido(dto.telefono, dto.messageId);
      }

      // Paso A: Buscar/Crear cliente por teléfono
      const cliente = await getOrCreateCliente.execute({ telefono: dto.telefono });

      // 🚨 CONTROL DE PENALIZACIONES (EL PORTERO)
      if (cliente.suspendido_hasta && cliente.suspendido_hasta > new Date()) {
          console.warn(`[Webhook] Cliente ${dto.telefono} intentó usar el servicio pero está SUSPENDIDO hasta ${cliente.suspendido_hasta}`);
          
          // Notificamos al cliente vía WhatsApp
          await whatsappRepo.enviarMensaje({ 
              telefono: dto.telefono, 
              texto: `⚠️ *Cuenta Suspendida Temporalmente*\n\nLo sentimos, tu cuenta ha sido suspendida debido a múltiples cancelaciones consecutivas de viajes asignados.\n\nPodrás volver a solicitar viajes después de: *${cliente.suspendido_hasta.toLocaleString()}*`
          });
          
          return reply.code(200).send(new WhatsappResponseDto('client_suspended'));
      }

      // Ejecutar BotMachine con el clienteId resuelto
      await botMachine.execute(dto.telefono, cliente.id || null, {
        type: dto.type,
        body: dto.body,
        replyId: dto.replyId,
        lat: dto.lat,
        lng: dto.lng
      });

      return reply.code(200).send(new WhatsappResponseDto());
    } catch (error: any) {
      console.error('[Webhook WSP Error]', error.message);
      return reply.code(200).send(new WhatsappResponseDto('error_handled'));
    }
  });
}
