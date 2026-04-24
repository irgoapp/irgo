import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { SolicitarViajeDto } from '../application/dto/in/solicitar-viaje.dto';
import { AceptarViajeDto } from '../application/dto/in/aceptar-viaje.dto';
import { ViajeResponseDto } from '../application/dto/out/viaje-response.dto';
import { SolicitarViajeUseCase } from '../application/use-cases/solicitar-viaje.usecase';
import { AceptarViajeUseCase } from '../application/use-cases/aceptar-viaje.usecase';
import { CotizarViajeUseCase } from '../application/use-cases/cotizar-viaje.usecase';
import { ConfirmarViajePasajeroUseCase } from '../application/use-cases/confirmar-viaje-pasajero.usecase';
import { CancelarViajeUseCase } from '../application/use-cases/cancelar-viaje.usecase';
import { ObtenerViajeUseCase } from '../application/use-cases/obtener-viaje.usecase';
import { CalificarViajeUseCase } from '../application/use-cases/calificar-viaje.usecase';
import { SupabaseViajeRepository } from '../infrastructure/supabase-viaje.repository';
import { SupabaseConductorRepository } from '../../conductor/infrastructure/supabase-conductor.repository';
import { ConsultarRutaMapaUseCase } from '../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { MapaApiClient } from '../../mapa/infrastructure/mapa-api.client';
import { CalcularClientePrecioUseCase } from '../../precio/application/use-cases/calcular-cliente-precio.usecase';
import { SupabasePrecioRepository } from '../../precio/infrastructure/supabase-precio.repository';
import { emitTripUpdate } from '../../shared/socket.handler';

// Repositorios e inyección cruzada por dependencias
const viajeRepository = new SupabaseViajeRepository();
const conductorRepository = new SupabaseConductorRepository();
const mapaRepository = new MapaApiClient();
const precioRepository = new SupabasePrecioRepository();

// Casos de Uso
const consultarRutaMapaUseCase = new ConsultarRutaMapaUseCase(mapaRepository);
const calcularClientePrecioUseCase = new CalcularClientePrecioUseCase(precioRepository);

const solicitarViajeUseCase = new SolicitarViajeUseCase(viajeRepository, conductorRepository);
const aceptarViajeUseCase = new AceptarViajeUseCase(viajeRepository);
const cotizarViajeUseCase = new CotizarViajeUseCase(consultarRutaMapaUseCase, calcularClientePrecioUseCase);
const confirmarViajePasajeroUseCase = new ConfirmarViajePasajeroUseCase(viajeRepository);
const cancelarViajeUseCase = new CancelarViajeUseCase(viajeRepository);
const obtenerViajeUseCase = new ObtenerViajeUseCase(viajeRepository);
const calificarViajeUseCase = new CalificarViajeUseCase(viajeRepository);

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
      return reply.code(400).send({ error: error.message });
    }
  });

  // El endpoint maestro de cotización para que el cliente pase de llamar a Mapas a llamar al Backend
  fastify.post('/cotizar', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { origen, destino, tipo } = request.body as any;
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
      const { destino, destino_texto, monto, distancia_km, duracion_min } = request.body as any;
      const viaje = await confirmarViajePasajeroUseCase.execute({
        viaje_id: request.params.id,
        destino,
        destino_texto,
        monto,
        distancia_km,
        duracion_min
      });
      return reply.code(200).send(viaje);
    } catch (error: any) {
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

}
