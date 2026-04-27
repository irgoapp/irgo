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

    if (conductorId) {
      // --- LÓGICA DE CONDUCTOR ---
      if (disconnectTimers.has(conductorId)) {
        clearTimeout(disconnectTimers.get(conductorId)!);
        disconnectTimers.delete(conductorId);
        console.log(`[Sockets] ✅ Conductor ${conductorId} reconectó a tiempo`);
      }

      socket.join(`conductor_${conductorId}`);
      
      conductorRepo.cambiarDisponibilidad(conductorId, true)
        .then(() => console.log(`[Sockets] ✅ Conductor ${conductorId} disponible en Supabase`))
        .catch(err => console.error(`Error activando disponibilidad para ${conductorId}`, err));

      console.log(`[Sockets] 🚕 Conductor ${conductorId} ONLINE en Socket: ${socket.id}`);

      socket.on('actualizar_ubicacion', async (payload: { lat: number; lng: number }) => {
         try {
           const dto = new ActualizarUbicacionDto({
             conductor_id: conductorId, 
             lat: payload.lat, 
             lng: payload.lng 
           });
           await ubicationCase.execute(dto);
         } catch (err) {
           console.log(`Error guardando GPS del Conductor ${conductorId}`, err);
         }
      });

      socket.on('disconnect', async () => {
        console.log(`[Sockets] ⚠️ Desconexión detectada del Conductor: ${conductorId}`);
        const timer = setTimeout(async () => {
          try {
            await conductorRepo.cambiarDisponibilidad(conductorId, false);
            console.log(`[Sockets] 🔴 Conductor ${conductorId} no disponible (timeout)`);
          } catch (err) {
            console.error(`Error desactivando conductor ${conductorId}`, err);
          }
          disconnectTimers.delete(conductorId);
        }, 60000); 
        disconnectTimers.set(conductorId, timer);
      });
    } else {
      // --- LÓGICA DE CLIENTE / PWA ---
      console.log(`[Sockets] 📱 Cliente (Pasajero) conectado en Socket: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`[Sockets] 📱 Cliente desconectado: ${socket.id}`);
      });
    }

    // --- LÓGICA COMÚN (PARA TODOS) ---
    socket.on('join_trip', (tripId: string) => {
      socket.join(`trip_${tripId}`);
      console.log(`[Sockets] 📱 Socket ${socket.id} unido a sala de viaje: ${tripId}`);
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
    
    try {
      const socketsEnSala = ioInstance.sockets.adapter.rooms.get(sala);
      
      console.log(`[Socket] 🔍 DIAGNÓSTICO: Sala target: ${sala}`);
      console.log(`[Socket] 👥 DIAGNÓSTICO: Dispositivos en sala: ${socketsEnSala?.size ?? 0}`);
      
      if (!socketsEnSala || socketsEnSala.size === 0) {
        console.warn(`[Socket] ⚠️ Alerta: El conductor ${conductorId} no tiene sockets activos en la sala ${sala}. La oferta se perderá.`);
      }

      // Emisión con captura de error de serialización
      ioInstance.to(sala).emit('oferta_viaje', oferta);
      
      console.log(`[Sockets] 📨 OFERTA_VIAJE emitida exitosamente a ${conductorId}`);
      return true;
    } catch (error: any) {
      console.error(`[Sockets] ❌ Error CRÍTICO en ioInstance.emit:`, error);
      return false;
    }
  }
  console.log(`[Socket] ❌ Error: ioInstance no inicializada`);
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

/**
 * Notifica a los conductores que estaban viendo la oferta que ya fue tomada por otro.
 */
export function emitirViajeTomado(viajeId: string) {
  if (ioInstance) {
    ioInstance.to(`trip_${viajeId}`).emit('viaje_tomado_por_otro', { viaje_id: viajeId });
    console.log(`[Sockets] 📢 Evento viaje_tomado_por_otro enviado para viaje ${viajeId}`);
  }
}

/**
 * Notifica que el cliente canceló el viaje.
 */
export function emitirViajeCancelado(viajeId: string) {
  if (ioInstance) {
    ioInstance.to(`trip_${viajeId}`).emit('viaje_cancelado_por_cliente', { viaje_id: viajeId });
    console.log(`[Sockets] 📢 Evento viaje_cancelado_por_cliente enviado para viaje ${viajeId}`);
  }
}

/**
 * Notifica que el tiempo de búsqueda expiró sin encontrar conductores.
 */
export function emitirViajeExpirado(viajeId: string) {
  if (ioInstance) {
    ioInstance.to(`trip_${viajeId}`).emit('viaje_expirado', { viaje_id: viajeId });
    console.log(`[Sockets] 📢 Evento viaje_expirado enviado para viaje ${viajeId}`);
  }
}

/**
 * Túnel de Chat: Envía un mensaje del cliente al conductor vía WebSocket.
 * Evento: chat:nuevo_mensaje
 */
export function emitirMensajeChat(conductorId: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`conductor_${conductorId}`).emit('chat:nuevo_mensaje', data);
    console.log(`[Sockets] 💬 chat:nuevo_mensaje emitido a conductor ${conductorId}`);
  }
}
