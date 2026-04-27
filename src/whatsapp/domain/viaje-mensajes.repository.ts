import { ViajeMensaje } from './viaje-mensajes.entity';

export interface IViajeMensajesRepository {
  guardarMensaje(mensaje: ViajeMensaje): Promise<ViajeMensaje>;
  obtenerMensajes(viajeId: string): Promise<ViajeMensaje[]>;
}
