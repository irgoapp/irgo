import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { MovimientoService } from '../application/services/movimiento.service';
import { SupabaseMovimientoRepository } from '../infrastructure/supabase-movimiento.repository';

const movimientoRepository = new SupabaseMovimientoRepository();
const movimientoService = new MovimientoService(movimientoRepository);

export async function movimientoControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // Endpoint para la Billetera del Driver
  fastify.get('/billetera/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const data = await movimientoService.consultarBilletera(request.params.id);
      return reply.code(200).send(data);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Endpoint para Recargas (Uso Interno/Admin)
  fastify.post('/recarga', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { conductor_id, monto, descripcion } = request.body as any;
      await movimientoService.procesarRecarga(conductor_id, monto, descripcion);
      return reply.code(200).send({ ok: true });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });
}
