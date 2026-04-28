import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AppVersionService } from './app-version.service';

const appVersionService = new AppVersionService();

export async function configControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  
  // GET /api/config/version (o /config/version)
  // Público - Sin JWT
  fastify.get('/version', async (request, reply) => {
    try {
      const info = await appVersionService.obtenerVersion('irgo-driver');
      
      if (!info) {
        return reply.status(404).send({ 
          error: 'No se encontró información de versión para irgo-driver' 
        });
      }

      return info;
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
