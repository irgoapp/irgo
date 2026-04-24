import { Viaje } from '../../../domain/viaje.entity';

/**
 * Este DTO está optimizado para el Bot de WhatsApp.
 * Solo contiene el ID necesario para generar el link mágico de destino.
 */
export class LinkWhatsappDto {
  viaje_id: string;
  estado: string;

  constructor(viaje: Viaje) {
    this.viaje_id = viaje.id!;
    this.estado = viaje.estado;
  }
}
