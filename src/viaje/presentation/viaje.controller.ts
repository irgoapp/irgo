import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { SolicitarViajeDto } from '../application/dto/in/solicitar-viaje.dto';
import { ConfirmarViajeDto } from '../application/dto/in/confirmar-viaje.dto';
import { AceptarViajeDto } from '../application/dto/in/aceptar-viaje.dto';
import { ViajeResponseDto } from '../application/dto/out/viaje-response.dto';
import { SolicitarViajeUseCase } from '../application/use-cases/solicitar-viaje.usecase';
import { AceptarViajeUseCase } from '../application/use-cases/aceptar-viaje.usecase';
import { CotizarViajeUseCase } from '../application/use-cases/cotizar-viaje.usecase';
import { ConfirmarViajeClienteUseCase } from '../application/use-cases/confirmar-viaje-cliente.usecase';
import { CancelarViajeUseCase } from '../application/use-cases/cancelar-viaje.usecase';
import { ObtenerViajeUseCase } from '../application/use-cases/obtener-viaje.usecase';
import { CalificarViajeUseCase } from '../application/use-cases/calificar-viaje.usecase';
import { MarcarLlegadaUseCase } from '../application/use-cases/marcar-llegada.usecase';
import { IniciarViajeUseCase } from '../application/use-cases/iniciar-viaje.usecase';
import { SupabaseViajeRepository } from '../infrastructure/supabase-viaje.repository';
import { SupabaseConductorRepository } from '../../conductor/infrastructure/supabase-conductor.repository';
import { ConsultarRutaMapaUseCase } from '../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { MapaApiClient } from '../../mapa/infrastructure/mapa-api.client';
import { CalcularClientePrecioUseCase } from '../../precio/application/use-cases/calcular-cliente-precio.usecase';
import { CalcularComisionUseCase } from '../../precio/application/use-cases/calcular-comision.usecase';
import { SupabasePrecioRepository } from '../../precio/infrastructure/supabase-precio.repository';
import { SupabaseClienteRepository } from '../../cliente/infrastructure/supabase-cliente.repository';
import { WhatsappMetaClient } from '../../whatsapp/infrastructure/whatsapp-meta.client';
import { WhatsappNotificationService } from '../../whatsapp/application/services/whatsapp-notification.service';
import { SupabaseMovimientoRepository } from '../../movimiento/infrastructure/supabase-movimiento.repository';
import { MovimientoService } from '../../movimiento/application/services/movimiento.service';
import { emitTripUpdate } from '../../shared/socket.handler';
import { SupabaseViajeMensajesRepository } from '../../whatsapp/infrastructure/supabase-viaje-mensajes.repository';
import { ViajeMensaje } from '../../whatsapp/domain/viaje-mensajes.entity';
import { SupabaseWspSessionRepository } from '../../whatsapp/infrastructure/supabase-wsp-session.repository';
import { SupabaseSalaViajeOfertaRepository } from '../infrastructure/supabase-sala-viaje-oferta.repository';
import { CerrarViajeUseCase } from '../application/use-cases/cerrar-viaje.usecase';

// Repositorios e inyección cruzada por dependencias
const viajeRepository = new SupabaseViajeRepository();
const conductorRepository = new SupabaseConductorRepository();
const mapaRepository = new MapaApiClient();
const precioRepository = new SupabasePrecioRepository();
const clienteRepository = new SupabaseClienteRepository();
const whatsappRepository = new WhatsappMetaClient();
const viajeMensajesRepo = new SupabaseViajeMensajesRepository();
const sessionRepository = new SupabaseWspSessionRepository();
const salaOfertasRepository = new SupabaseSalaViajeOfertaRepository();

// Casos de Uso y Servicios
const movimientoRepository = new SupabaseMovimientoRepository();
const movimientoService = new MovimientoService(movimientoRepository);

const whatsappNotificationService = new WhatsappNotificationService(whatsappRepository);

const consultarRutaMapaUseCase = new ConsultarRutaMapaUseCase(mapaRepository);
const calcularClientePrecioUseCase = new CalcularClientePrecioUseCase(precioRepository);
const calcularComisionUseCase = new CalcularComisionUseCase(precioRepository);

const solicitarViajeUseCase = new SolicitarViajeUseCase(viajeRepository, conductorRepository, consultarRutaMapaUseCase, calcularClientePrecioUseCase, clienteRepository);
const aceptarViajeUseCase = new AceptarViajeUseCase(viajeRepository, conductorRepository, consultarRutaMapaUseCase, whatsappNotificationService, movimientoService, salaOfertasRepository);
const cotizarViajeUseCase = new CotizarViajeUseCase(consultarRutaMapaUseCase, calcularClientePrecioUseCase);
const confirmarViajeClienteUseCase = new ConfirmarViajeClienteUseCase(viajeRepository, conductorRepository, consultarRutaMapaUseCase, calcularClientePrecioUseCase, calcularComisionUseCase, salaOfertasRepository);
const cancelarViajeUseCase = new CancelarViajeUseCase(viajeRepository, movimientoService, clienteRepository, sessionRepository, salaOfertasRepository);
const cerrarViajeUseCase = new CerrarViajeUseCase(viajeRepository, salaOfertasRepository);
const obtenerViajeUseCase = new ObtenerViajeUseCase(viajeRepository);
const calificarViajeUseCase = new CalificarViajeUseCase(viajeRepository);
const marcarLlegadaUseCase = new MarcarLlegadaUseCase(viajeRepository, whatsappNotificationService);
const iniciarViajeUseCase = new IniciarViajeUseCase(viajeRepository, whatsappNotificationService);

export async function viajeControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dto = new SolicitarViajeDto(request.body);
      const viaje = await solicitarViajeUseCase.execute(dto);
      return reply.code(201).send(new ViajeResponseDto(viaje));
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const viaje = await obtenerViajeUseCase.execute(request.params.id);
      return reply.code(200).send(viaje);
    } catch (error: any) {
      return reply.code(404).send({ error: error.message });
    }
  });

  fastify.post('/:id/aceptar', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const dto = new AceptarViajeDto({ viaje_id: request.params.id, ...(request.body as any) });
      const viaje = await aceptarViajeUseCase.execute(dto);
      
      // Notificar al cliente vía WebSockets
      emitTripUpdate(request.params.id, viaje);

      return reply.code(200).send(new ViajeResponseDto(viaje));
    } catch (error: any) {
      console.error(`[ViajeController] ❌ ERROR AL ACEPTAR VIAJE ${request.params.id}:`, error.message);
      return reply.code(400).send({ error: error.message });
    }
  });

  // El endpoint maestro de cotización para que el cliente pase de llamar a Mapas a llamar al Backend
  fastify.post('/cotizar', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { origen, destino, tipo } = request.body as any;
      console.log(`[ViajeController] 💰 Cotizando viaje: ${tipo} (${origen.lat},${origen.lng}) -> (${destino.lat},${destino.lng})`);
      const cotizacion = await cotizarViajeUseCase.execute({
        origen,
        destino,
        tipo_vehiculo: tipo
      });
      return reply.code(200).send(cotizacion);
    } catch (error: any) {
      console.error('[CotizarController] Error:', error.message);
      return reply.code(400).send({ 
        error: 'Error al cotizar viaje', 
        message: error.message 
      });
    }
  });

  // Endpoints de Geocodificación (Proxy Protegido)
  fastify.get('/buscar', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q } = request.query as any;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&bounded=1&viewbox=-63.31,-17.68,-63.07,-18.01&accept-language=es`;
      const response = await fetch(url, { headers: { 'User-Agent': 'IrGo-Backend' } });
      const data = await response.json();
      return reply.code(200).send(data);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.get('/reverso', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { lat, lng } = request.query as any;
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
      const response = await fetch(url, { headers: { 'User-Agent': 'IrGo-Backend' } });
      const data = await response.json();
      return reply.code(200).send(data);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/confirmar', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      console.log(`[ViajeController] ✅ Confirmando viaje ID: ${request.params.id}`);
      const dto = new ConfirmarViajeDto({ 
        viaje_id: request.params.id, 
        ...(request.body as any) 
      });
      const viaje = await confirmarViajeClienteUseCase.execute(dto);
      return reply.code(200).send(viaje);
    } catch (error: any) {
      console.error(`[ViajeController] ❌ Error confirmando viaje ${request.params.id}:`, error.message);
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/cancelar', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { motivo } = request.body as any;
      const exito = await cancelarViajeUseCase.execute({
        viaje_id: request.params.id,
        motivo: motivo || 'Cancelado por el cliente',
        cancelado_por: 'cliente'
      });
      return reply.code(200).send({ ok: exito });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/llegue', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      console.log(`[ViajeController] 🚕 Conductor reporta llegada para viaje: ${request.params.id}`);
      const viaje = await marcarLlegadaUseCase.execute(request.params.id);
      
      // Notificar al cliente vía WebSockets
      emitTripUpdate(request.params.id, viaje);

      return reply.code(200).send(new ViajeResponseDto(viaje));
    } catch (error: any) {
      console.error(`[ViajeController] ❌ Error marcando llegada para viaje ${request.params.id}:`, error.message);
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/iniciar', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { pin_verificacion } = request.body as any;
      console.log(`[ViajeController] 🚕 Conductor intenta iniciar viaje: ${request.params.id} con PIN: ${pin_verificacion}`);
      
      const viaje = await iniciarViajeUseCase.execute({
        viaje_id: request.params.id,
        pin: pin_verificacion
      });
      
      // Notificar al cliente vía WebSockets
      emitTripUpdate(request.params.id, viaje);

      return reply.code(200).send(new ViajeResponseDto(viaje));
    } catch (error: any) {
      console.error(`[ViajeController] ❌ Error iniciando viaje ${request.params.id}:`, error.message);
      // Si el error es por PIN incorrecto, mandamos 403 según especificación
      if (error.message.includes('PIN')) {
          return reply.code(403).send({ error: error.message });
      }
      return reply.code(400).send({ error: error.message });
    }
  });

  // Endpoints para Finalizar / Completar Viaje
  const finalizarHandler = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const dto = new CerrarViajeDto({ 
        viaje_id: request.params.id, 
        ...(request.body as any) 
      });
      
      const viaje = await cerrarViajeUseCase.execute(dto);
      
      // Notificar al cliente vía WebSockets
      emitTripUpdate(request.params.id, viaje);

      return reply.code(200).send(new ViajeResponseDto(viaje));
    } catch (error: any) {
      console.error(`[ViajeController] ❌ Error finalizando viaje ${request.params.id}:`, error.message);
      return reply.code(400).send({ error: error.message });
    }
  };

  fastify.post('/:id/finalizar', finalizarHandler);
  fastify.post('/:id/completar', finalizarHandler);

  fastify.post('/:id/calificar', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { rating } = request.body as any;
      const exito = await calificarViajeUseCase.execute({
        viaje_id: request.params.id,
        rating
      });
      return reply.code(200).send({ ok: exito });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════
  // CHAT: Conductor → Cliente (vía WhatsApp)
  // ═══════════════════════════════════════════════
  fastify.post('/:id/chat', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { contenido } = request.body as any;
      if (!contenido || !contenido.trim()) {
        return reply.code(400).send({ error: 'El mensaje no puede estar vacío' });
      }

      const viaje = await viajeRepository.buscarPorId(request.params.id);
      if (!viaje) return reply.code(404).send({ error: 'Viaje no encontrado' });
      if (!viaje.conductor_id) return reply.code(400).send({ error: 'Viaje sin conductor asignado' });

      // 1. Guardar mensaje en viaje_mensajes
      const mensaje = new ViajeMensaje({
        viaje_id: request.params.id,
        emisor_tipo: 'conductor',
        contenido: contenido.trim()
      });
      await viajeMensajesRepo.guardarMensaje(mensaje);

      // 2. Buscar teléfono del cliente para reenviar por WhatsApp
      const cliente = await clienteRepository.buscarPorId(viaje.cliente_id);
      if (cliente?.telefono) {
        await whatsappNotificationService.notificarMensajeConductor(cliente.telefono, contenido.trim());
      }

      console.log(`[ViajeChat] 💬 Mensaje del conductor guardado y reenviado para viaje ${request.params.id}`);
      return reply.code(200).send({ ok: true });
    } catch (error: any) {
      console.error(`[ViajeChat] ❌ Error:`, error.message);
      return reply.code(400).send({ error: error.message });
    }
  });

  // RUTA GENÉRICA (Para evitar 404 si la APK no manda ID en la URL)
  fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { viaje_id, contenido } = request.body as any;
      if (!viaje_id || !contenido) {
        return reply.code(400).send({ error: 'viaje_id y contenido son obligatorios' });
      }

      const viaje = await viajeRepository.buscarPorId(viaje_id);
      if (!viaje) return reply.code(404).send({ error: 'Viaje no encontrado' });

      const mensaje = new ViajeMensaje({
        viaje_id,
        emisor_tipo: 'conductor',
        contenido: contenido.trim()
      });
      await viajeMensajesRepo.guardarMensaje(mensaje);

      const cliente = await clienteRepository.buscarPorId(viaje.cliente_id);
      if (cliente?.telefono) {
        await whatsappNotificationService.notificarMensajeConductor(cliente.telefono, contenido.trim());
      }

      return reply.code(200).send({ ok: true });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

}

