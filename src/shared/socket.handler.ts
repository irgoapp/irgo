import { Server } from 'socket.io';
import { SupabaseConductorRepository } from '../conductor/infrastructure/supabase-conductor.repository';
import { ActualizarUbicacionConductorUseCase } from '../conductor/application/use-cases/actualizar-ubicacion-conductor.usecase';
import { ActualizarUbicacionDto } from '../conductor/application/dto/in/actualizar-ubicacion.dto';

let ioInstance: Server;

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: '*', // Permitir conexión desde las APK (ajustar en producción)
      methods: ['GET', 'POST']
    }
  });

  const conductorRepo = new SupabaseConductorRepository();
  const ubicationCase = new ActualizarUbicacionConductorUseCase(conductorRepo);

  io.on('connection', (socket) => {
    // Extraemos de forma nativa el Auth que configuró Gemini en Flutter
    const conductorId = socket.handshake.auth.conductor_id;

    if (!conductorId) {
      console.log(`[Sockets] ❌ Conexión rechazada (Sin Conductor ID): ${socket.id}`);
      socket.disconnect();
      return;
    }

    // Le creamos una SALA VIP Privada solo para él
    socket.join(`conductor_${conductorId}`);
    console.log(`[Sockets] 🚕 Conductor ${conductorId} ONLINE en Socket: ${socket.id}`);

    // Escuchador de Ubicaciones en GPS Tiempo Real
    socket.on('actualizar_ubicacion', async (payload: { lat: number; lon: number }) => {
       try {
         // Cuando Flutter manda esto, sin usar HTTP pesado, guardamos en base de datos.
         const dto = new ActualizarUbicacionDto({
           conductor_id: conductorId, 
           lat: payload.lat, 
           lon: payload.lon 
         });
         await ubicationCase.execute(dto);
       } catch (err) {
         console.log(`Error guardando GPS del Conductor ${conductorId}`, err);
       }
    });

    socket.on('disconnect', () => {
      console.log(`[Sockets] 🔴 Desconexión: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Función global para que tu módulo de VIAJES pueda 
 * dispararle una oferta a un conductor en específico.
 */
export function emitirOfertaViaje(conductorId: string, oferta: any) {
  if (ioInstance) {
    ioInstance.to(`conductor_${conductorId}`).emit('NUEVA_SOLICITUD', oferta);
    return true;
  }
  return false;
}
