import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

// Repositorios e Inyección de Dependencias
import { WhatsappMetaClient } from '../infrastructure/whatsapp-meta.client';
import { SupabaseWspSessionRepository } from '../infrastructure/supabase-wsp-session.repository';
import { SupabaseClienteRepository } from '../../cliente/infrastructure/supabase-cliente.repository';
import { SupabaseViajeRepository } from '../../viaje/infrastructure/supabase-viaje.repository';
import { SupabaseConductorRepository } from '../../conductor/infrastructure/supabase-conductor.repository';

// Casos de Uso
import { BotMachineUseCase } from '../application/use-cases/bot-machine.usecase';
import { HandleStartUseCase } from '../application/use-cases/estados/handle-start.usecase';
import { HandleLocationUseCase } from '../application/use-cases/estados/handle-location.usecase';
import { HandleInteraccionUseCase } from '../application/use-cases/handle-interaccion.usecase';
import { HandleConfirmationUseCase } from '../application/use-cases/estados/handle-confirmation.usecase';
import { IniciarBorradorViajeUseCase } from '../../viaje/application/use-cases/iniciar-borrador-viaje.usecase';

// DTOs
import { ProcesarWebhookDto } from '../application/dto/in/procesar-webhook.dto';
import { WhatsappResponseDto } from '../application/dto/out/whatsapp-response.dto';

// Instanciación del Árbol
const wpsRepo = new WhatsappMetaClient();
const sessionRepo = new SupabaseWspSessionRepository();
const clienteRepo = new SupabaseClienteRepository();
const viajeRepo = new SupabaseViajeRepository();
const conductorRepo = new SupabaseConductorRepository();

// El UseCase de Viaje (Solo crea el borrador sin alertar)
const iniciarBorradorViaje = new IniciarBorradorViajeUseCase(viajeRepo);

// Los sub-estados de WhatsApp
const handleStart = new HandleStartUseCase(wpsRepo, clienteRepo);
const handleLocation = new HandleLocationUseCase(sessionRepo, wpsRepo, clienteRepo, iniciarBorradorViaje);
const handleConfirm = new HandleConfirmationUseCase(wpsRepo, sessionRepo);
const handleInteraccion = new HandleInteraccionUseCase(wpsRepo, sessionRepo);

// La máquina enrutadora final
const botMachine = new BotMachineUseCase(
  sessionRepo, 
  handleStart, 
  handleLocation, 
  handleConfirm,
  handleInteraccion
);

export async function whatsappControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Endpoint usado por META WHATSAPP WEBHOOK (Verificación inicial)
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

  // Endpoint usado por META WHATSAPP WEBHOOK (Recepción de mensajes)
  fastify.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Validar entrada vía DTO
      const dto = new ProcesarWebhookDto(request.body);
      dto.validar();
      
      if (dto.type === 'status_update') {
        return reply.code(200).send(new WhatsappResponseDto());
      }

      console.log(`[Webhook] Recibido de: ${dto.telefono} | Tipo: ${dto.type} | ID: ${dto.messageId}`);
      
      // 2. Marcar como leído inmediatamente (Truco de delivery de Meta)
      if (dto.messageId) {
        await wpsRepo.marcarLeido(dto.telefono, dto.messageId);
      }
      
      // 3. Ejecutar Lógica
      await botMachine.execute(dto.telefono, {
        type: dto.type,
        body: dto.body,
        replyId: dto.replyId,
        lat: dto.lat,
        lng: dto.lng
      });

      // 3. Responder vía DTO de salida
      return reply.code(200).send(new WhatsappResponseDto());
    } catch (error: any) {
       console.error('[Webhook WSP Error]', error.message);
       // Aunque falle algo interno, a Meta solemos responderle 200 para evitar re-intentos infinitos,
       // pero la regla dice que el controlador debe manejar errores
       return reply.code(200).send(new WhatsappResponseDto('error_handled'));
    }
  });
}
