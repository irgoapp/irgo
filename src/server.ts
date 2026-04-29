// v1.0.2 - Optimización para Despliegue en Railway
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { setupSocket } from './shared/socket.handler';
import { errorHandler } from './shared/error.handler';

// Importación de Controladores
import { conductorControllerPlugin } from './conductor/presentation/conductor.controller';
import { viajeControllerPlugin } from './viaje/presentation/viaje.controller';
import { precioControllerPlugin } from './precio/presentation/precio.controller';
import { mapaControllerPlugin } from './mapa/presentation/mapa.controller';
import { whatsappControllerPlugin } from './whatsapp/presentation/whatsapp.controller';
import { authControllerPlugin } from './auth/presentation/auth.controller';
import { clienteControllerPlugin } from './cliente/presentation/cliente.controller';
import { movimientoControllerPlugin } from './movimiento/presentation/movimiento.controller';
import { configControllerPlugin } from './services/config.controller';

const fastify = Fastify({ 
  logger: true,
  trustProxy: true // Necesario para Railway y Rate Limit
});

// 1. Middlewares Core
fastify.register(cors);

// 2. Rate Limiting con Exclusión de Healthcheck
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'], // Localhost
  skipOnError: true,
  // Excluimos el healthcheck para que Railway no sea bloqueado
  keyGenerator: (request) => {
    if (request.url === '/') return 'healthcheck'; 
    return request.ip;
  },
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Has realizado demasiadas solicitudes. Por favor, intenta de nuevo en ${context.after}.`
    }
  }
});

fastify.setErrorHandler(errorHandler);

// 3. Health Check oficial para Railway
fastify.get('/', async () => {
  return { status: 'ok', message: 'IRGO Backend Is Live', version: '1.0.2' };
});

// 4. Registro de Dominios
fastify.register(conductorControllerPlugin, { prefix: '/api/conductor' });
fastify.register(conductorControllerPlugin, { prefix: '/conductor' });

fastify.register(viajeControllerPlugin, { prefix: '/api/viaje' });
fastify.register(viajeControllerPlugin, { prefix: '/viaje' });

fastify.register(authControllerPlugin, { prefix: '/api/auth' });
fastify.register(authControllerPlugin, { prefix: '/auth' });

fastify.register(movimientoControllerPlugin, { prefix: '/api/movimiento' });
fastify.register(precioControllerPlugin, { prefix: '/precio' });
fastify.register(mapaControllerPlugin, { prefix: '/mapa' });
fastify.register(whatsappControllerPlugin, { prefix: '/whatsapp' });
fastify.register(clienteControllerPlugin, { prefix: '/cliente' });
fastify.register(configControllerPlugin, { prefix: '/api/config' });

// 5. Arranque del Servidor
const start = async () => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  const ADDRESS = '0.0.0.0'; 

  try {
    console.log(`🚀 Intentando arrancar servidor en puerto ${PORT}...`);
    
    await fastify.listen({ port: PORT, host: ADDRESS });
    
    // Socket.io se monta sobre el servidor HTTP nativo
    setupSocket(fastify.server);
    
    console.log(`✅ IRGO ONLINE: Escuchando en: http://${ADDRESS}:${PORT}`);

    // Manejo de apagado gracioso
    const shutdown = async () => {
      console.log('🛑 Recibida señal de apagado. Cerrando servidor...');
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('❌ Error fatal al iniciar el servidor:', err);
    process.exit(1);
  }
};

start();
