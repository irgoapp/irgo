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
import { movimientoControllerPlugin } from './movimiento/presentation/movimiento.controller';

const fastify = Fastify({ logger: true });

fastify.register(cors);
fastify.register(import('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Has realizado demasiadas solicitudes. Por favor, intenta de nuevo en ${context.after}.`
    }
  }
});
fastify.setErrorHandler(errorHandler);

// Health Check oficial para Railway
fastify.get('/', async () => {
  return { status: 'ok', message: 'IRGO Backend Is Live' };
});

// Registrar dominios (Soporte Dual para App y Dashboard)
fastify.register(conductorControllerPlugin, { prefix: '/conductor' });
fastify.register(conductorControllerPlugin, { prefix: '/api/conductor' });

fastify.register(viajeControllerPlugin, { prefix: '/viaje' });
fastify.register(viajeControllerPlugin, { prefix: '/api/viaje' });

fastify.register(authControllerPlugin, { prefix: '/auth' });
fastify.register(authControllerPlugin, { prefix: '/api/auth' });

// Módulos específicos
fastify.register(movimientoControllerPlugin, { prefix: '/api/movimiento' });
fastify.register(precioControllerPlugin, { prefix: '/precio' });
fastify.register(mapaControllerPlugin, { prefix: '/mapa' });
fastify.register(whatsappControllerPlugin, { prefix: '/whatsapp' });
fastify.register(clienteControllerPlugin, { prefix: '/cliente' });
import { configControllerPlugin } from './services/config.controller';
fastify.register(configControllerPlugin, { prefix: '/api/config' });

const start = async () => {
  // 1. Forzamos la lectura de la variable que inyecta Railway
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  
  // 2. Fastify DEBE escuchar en 0.0.0.0 para ser visible en la red de Railway
  const ADDRESS = '0.0.0.0'; 

  try {
    await fastify.listen({ port: PORT, host: ADDRESS });
    
    // DESPUÉS montamos Socket.io sobre el servidor ya activo
    setupSocket(fastify.server);
    
    // CAMBIEN EL LOG PARA ESTAR SEGUROS:
    console.log(`✅ IRGO ONLINE: Escuchando en el puerto real: ${PORT}`);

    // Manejo de señales de apagado (Graceful Shutdown)
    const shutdown = async () => {
      console.log('🛑 Recibida señal de apagado. Cerrando servidor...');
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
