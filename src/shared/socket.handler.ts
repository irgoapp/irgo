import { Server } from 'socket.io';
import { SupabaseConductorRepository } from '../conductor/infrastructure/supabase-conductor.repository';
import { ActualizarUbicacionConductorUseCase } from '../conductor/application/use-cases/actualizar-ubicacion-conductor.usecase';
import { ActualizarUbicacionDto } from '../conductor/application/dto/in/actualizar-ubicacion.dto';

let ioInstance: Server;
const disconnectTimers = new Map<string, NodeJS.Timeout>();

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
    const conductorId = socket.handshake.auth.conductor_id;

    if (!conductorId) {
      console.log(`[Sockets] ❌ Conexión rechazada (Sin Conductor ID): ${socket.id}`);
      socket.disconnect();
      return;
    }

    // Si reconecta antes de los 15 segundos cancela el timer de desconexión
    if (disconnectTimers.has(conductorId)) {
      clearTimeout(disconnectTimers.get(conductorId)!);
      disconnectTimers.delete(conductorId);
      console.log(`[Sockets] ✅ Conductor ${conductorId} reconectó a tiempo`);
    }

    socket.join(`conductor_${conductorId}`);
    
    // Automatización: Al conectar por socket, el conductor pasa a estar disponible
    conductorRepo.cambiarDisponibilidad(conductorId, true)
      .then(() => console.log(`[Sockets] ✅ Conductor ${conductorId} disponible en Supabase`))
      .catch(err => console.error(`Error activando disponibilidad para ${conductorId}`, err));

    console.log(`[Sockets] 🚕 Conductor ${conductorId} ONLINE en Socket: ${socket.id}`);

    // Escuchador de Ubicaciones en GPS Tiempo Real
    socket.on('actualizar_ubicacion', async (payload: { lat: number; lon: number }) => {
       try {
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

    // --- CLIENTE WEB ---
    socket.on('join_trip', (tripId: string) => {
      socket.join(`trip_${tripId}`);
      console.log(`[Sockets] 📱 Cliente unido a sala de viaje: ${tripId}`);
    });

    socket.on('disconnect', async () => {
      console.log(`[Sockets] ⚠️ Desconexión detectada: ${conductorId}`);
      
      const timer = setTimeout(async () => {
        try {
          await conductorRepo.cambiarDisponibilidad(conductorId, false);
          console.log(`[Sockets] 🔴 Conductor ${conductorId} no disponible (timeout)`);
        } catch (err) {
          console.error(`Error desactivando conductor ${conductorId}`, err);
        }
        disconnectTimers.delete(conductorId);
      }, 15000); // 15 segundos de gracia
      
      disconnectTimers.set(conductorId, timer);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Función global para que tu módulo de SOLICITUDES pueda 
 * dispararle una oferta a un conductor en específico.
 */
export function emitirOfertaViaje(conductorId: string, oferta: any) {
  if (ioInstance) {
    const sala = `conductor_${conductorId}`;
    const socketsEnSala = ioInstance.sockets.adapter.rooms.get(sala);
    
    console.log(`[Socket] Intentando emitir a sala: ${sala}`);
    console.log(`[Socket] Sockets en esa sala: ${socketsEnSala?.size ?? 0}`);
    
    ioInstance.to(sala).emit('oferta_viaje', oferta);
    console.log(`[Sockets] 📨 OFERTA_VIAJE enviada al conductor ${conductorId}`);
    return true;
  }
  console.log(`[Socket] ioInstance no existe`);
  return false;
}

/**
 * Notifica al cliente web que el viaje ha cambiado (ej. conductor aceptó)
 */
export function emitTripUpdate(tripId: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`trip_${tripId}`).emit('trip_updated', data);
    console.log(`[Sockets] 📢 Notificación de actualización enviada al viaje ${tripId}`);
  }
}
