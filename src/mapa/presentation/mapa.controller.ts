import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ConsultarRutaMapaUseCase } from '../application/use-cases/consultar-ruta-mapa.usecase';
import { MapaResponseDto } from '../application/dto/out/mapa-response.dto';
import { MapaApiClient } from '../infrastructure/mapa-api.client';

const mapaApiClient = new MapaApiClient();
const consultarRutaMapaUseCase = new ConsultarRutaMapaUseCase(mapaApiClient);

export async function mapaControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/ruta', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body: any = request.body;
      const mapa = await consultarRutaMapaUseCase.execute({
        origen: body.origen,
        destino: body.destino
      });
      return reply.code(200).send(mapa);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });
}
