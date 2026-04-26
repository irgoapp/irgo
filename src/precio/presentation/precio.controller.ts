import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { CalcularClientePrecioUseCase } from '../application/use-cases/calcular-cliente-precio.usecase';
import { PrecioResponseDto } from '../application/dto/out/precio-response.dto';
import { SupabasePrecioRepository } from '../infrastructure/supabase-precio.repository';

const repository = new SupabasePrecioRepository();
const calcularClientePrecioUseCase = new CalcularClientePrecioUseCase(repository);

export async function precioControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/calcular', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body: any = request.body;
      if (!body.distancia_ruta || !body.tiempo_ruta || !body.tipo_vehiculo) {
        throw new Error('Parametros invalidos');
      }

      const precios = await calcularClientePrecioUseCase.execute({
        distancia_ruta: body.distancia_ruta,
        tipo_vehiculo: body.tipo_vehiculo
      });
      return reply.code(200).send(new PrecioResponseDto(precios.monto_ruta, 'USD'));
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });
}
