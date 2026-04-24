import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { GetOrCreateClienteUseCase } from '../application/use-cases/get-or-create-cliente.usecase';
import { SupabaseClienteRepository } from '../infrastructure/supabase-cliente.repository';

const repository = new SupabaseClienteRepository();
const getOrCreateUseCase = new GetOrCreateClienteUseCase(repository);

export async function clienteControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/auth/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body: any = request.body;
      const cliente = await getOrCreateUseCase.execute({ telefono: body.telefono, nombre: body.nombre });
      return reply.code(200).send(cliente);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });
}
