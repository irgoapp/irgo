// v1.0.4 - Fix Crítico de Arranque (Eliminación de posibles bloqueos)
import Fastify from 'fastify';
import cors from '@fastify/cors';

console.log('🚀 [STARTUP] El proceso de Node ha iniciado correctamente.');

const fastify = Fastify({ 
  logger: true,
  trustProxy: true 
});

// Healthcheck inmediato y síncrono
fastify.get('/', async () => {
  return { status: 'ok', message: 'IRGO Backend Is Live', version: '1.0.5' };
});

const start = async () => {
  try {
    console.log('📦 [STARTUP] Cargando dependencias y módulos...');
    
    // Importaciones dinámicas dentro del start para capturar errores de carga
    const { setupSocket } = await import('./shared/socket.handler');
    const { errorHandler } = await import('./shared/error.handler');
    const { conductorControllerPlugin } = await import('./conductor/presentation/conductor.controller');
    const { viajeControllerPlugin } = await import('./viaje/presentation/viaje.controller');
    const { authControllerPlugin } = await import('./auth/presentation/auth.controller');
    const { configControllerPlugin } = await import('./services/config.controller');
    const { precioControllerPlugin } = await import('./precio/presentation/precio.controller');
    const { mapaControllerPlugin } = await import('./mapa/presentation/mapa.controller');
    const { whatsappControllerPlugin } = await import('./whatsapp/presentation/whatsapp.controller');
    const { clienteControllerPlugin } = await import('./cliente/presentation/cliente.controller');

    await fastify.register(cors);
    fastify.setErrorHandler(errorHandler);

    // 2. Rate Limiting Blindado (Carga Dinámica)
    try {
      const rateLimitPlugin = await import('@fastify/rate-limit');
      await fastify.register(rateLimitPlugin.default || rateLimitPlugin, {
        max: 100,
        timeWindow: '1 minute',
        skipOnError: true,
        keyGenerator: (req) => req.ip || '127.0.0.1',
        errorResponseBuilder: (request, context) => {
          return {
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Has realizado demasiadas solicitudes. Intenta de nuevo en ${context.after}.`
          }
        }
      });
      console.log('🛡️ [SUCCESS] Rate Limiter activado y protegido.');
    } catch (rlError) {
      console.error('⚠️ [WARNING] No se pudo cargar el Rate Limiter, continuando sin él:', rlError);
    }

    // Registro de rutas
    await fastify.register(conductorControllerPlugin, { prefix: '/api/conductor' });
    await fastify.register(conductorControllerPlugin, { prefix: '/conductor' });
    await fastify.register(viajeControllerPlugin, { prefix: '/api/viaje' });
    await fastify.register(viajeControllerPlugin, { prefix: '/viaje' });
    await fastify.register(authControllerPlugin, { prefix: '/api/auth' });
    await fastify.register(authControllerPlugin, { prefix: '/auth' });
    await fastify.register(configControllerPlugin, { prefix: '/api/config' });
    
    // Otros módulos
    await fastify.register(precioControllerPlugin, { prefix: '/precio' });
    await fastify.register(mapaControllerPlugin, { prefix: '/mapa' });
    await fastify.register(whatsappControllerPlugin, { prefix: '/whatsapp' });
    await fastify.register(clienteControllerPlugin, { prefix: '/cliente' });

    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
    const ADDRESS = '0.0.0.0'; 

    console.log(`📡 [STARTUP] Intentando abrir puerto ${PORT} en ${ADDRESS}...`);
    
    await fastify.listen({ port: PORT, host: ADDRESS });
    
    // Iniciar Sockets
    setupSocket(fastify.server);
    
    console.log(`✅ [SUCCESS] Servidor escuchando en puerto ${PORT}`);

  } catch (err) {
    console.error('💥 [FATAL ERROR] Fallo durante el registro de módulos:', err);
    // No salimos con 1 inmediatamente para dejar que el log se procese en Railway
    setTimeout(() => process.exit(1), 1000);
  }
};

start().catch(err => {
  console.error('💥 [FATAL ERROR] Error no controlado en la promesa de arranque:', err);
  setTimeout(() => process.exit(1), 1000);
});
