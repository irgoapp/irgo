// v1.0.1 - Estabilidad y Conectividad Maps-API
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { setupSocket } from './shared/socket.handler';
import { errorHandler } from './shared/error.handler';
import { conductorControllerPlugin } from './conductor/presentation/conductor.controller';
import { viajeControllerPlugin } from './viaje/presentation/viaje.controller';
import { precioControllerPlugin } from './precio/presentation/precio.controller';
import { mapaControllerPlugin } from './mapa/presentation/mapa.controller';
import { whatsappControllerPlugin } from './whatsapp/presentation/whatsapp.controller';
import { authControllerPlugin } from './auth/presentation/auth.controller';
import { clienteControllerPlugin } from './cliente/presentation/cliente.controller';

const fastify = Fastify({ logger: true });

fastify.register(cors);
fastify.setErrorHandler(errorHandler);

// Health Check oficial para Railway
fastify.get('/', async () => {
  return { status: 'ok', service: 'irgo-backend', timestamp: new Date().toISOString() };
});

// Registrar dominios verticalizados
fastify.register(conductorControllerPlugin, { prefix: '/conductor' });
fastify.register(viajeControllerPlugin, { prefix: '/viaje' });
fastify.register(precioControllerPlugin, { prefix: '/precio' });
fastify.register(mapaControllerPlugin, { prefix: '/mapa' });
fastify.register(whatsappControllerPlugin, { prefix: '/whatsapp' });
fastify.register(authControllerPlugin, { prefix: '/auth' });
fastify.register(clienteControllerPlugin, { prefix: '/cliente' });

const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || '3005', 10);
    
    // Montamos Socket.IO usando el servidor Nativo subyacente de Fastify ANTES del listen
    setupSocket(fastify.server);

    // Fastify requiere estar escuchando para darnos el objeto raw `server`
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    
    console.log(`🚀 IRGO Backend Vertical listo y escuchando en puerto ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
