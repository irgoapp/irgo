// v1.0.3 - Depuración de Arranque para Railway
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

// Log de inicio inmediato
console.log('🎬 Iniciando IRGO Backend...');

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
import { setupSocket } from './shared/socket.handler';
import { errorHandler } from './shared/error.handler';

const fastify = Fastify({ 
  logger: true,
  trustProxy: true 
});

// --- EL HEALTHCHECK DEBE IR ANTES QUE TODO ---
fastify.get('/', async () => {
  return { status: 'ok', message: 'IRGO Backend Is Live', version: '1.0.3' };
});

const start = async () => {
  try {
    // 1. Middlewares Core
    await fastify.register(cors);
    
    // 2. Rate Limiting Simplificado para evitar fallos de arranque
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      skipOnError: true // Si falla el rate limit, que la app siga viva
    });

    fastify.setErrorHandler(errorHandler);

    // 3. Registro de Dominios
    await fastify.register(conductorControllerPlugin, { prefix: '/api/conductor' });
    await fastify.register(conductorControllerPlugin, { prefix: '/conductor' });

    await fastify.register(viajeControllerPlugin, { prefix: '/api/viaje' });
    await fastify.register(viajeControllerPlugin, { prefix: '/viaje' });

    await fastify.register(authControllerPlugin, { prefix: '/api/auth' });
    await fastify.register(authControllerPlugin, { prefix: '/auth' });

    await fastify.register(movimientoControllerPlugin, { prefix: '/api/movimiento' });
    await fastify.register(precioControllerPlugin, { prefix: '/precio' });
    await fastify.register(mapaControllerPlugin, { prefix: '/mapa' });
    await fastify.register(whatsappControllerPlugin, { prefix: '/whatsapp' });
    await fastify.register(clienteControllerPlugin, { prefix: '/cliente' });
    await fastify.register(configControllerPlugin, { prefix: '/api/config' });

    // 4. Configuración de Puerto y Host (Obligatorio para Railway)
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
    const ADDRESS = '0.0.0.0'; 

    console.log(`📡 Intentando escuchar en ${ADDRESS}:${PORT}...`);
    
    await fastify.listen({ port: PORT, host: ADDRESS });
    
    // Socket.io se monta DESPUÉS de que el servidor HTTP esté listo
    setupSocket(fastify.server);
    
    console.log(`✅ EXITO: IRGO Backend escuchando en el puerto ${PORT}`);

  } catch (err) {
    console.error('💥 ERROR CRÍTICO EN ARRANQUE:', err);
    process.exit(1);
  }
};

// Manejo de apagado gracioso
const shutdown = async () => {
  console.log('🛑 Recibida señal de apagado. Cerrando...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Ejecutar
start();
