import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { IniciarViajeInDto } from '../dto/in/iniciar-viaje.in.dto';
import { LinkWhatsappDto } from '../dto/out/link-whatsapp.dto';

export class IniciarBorradorViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: IniciarViajeInDto): Promise<LinkWhatsappDto> {
    dto.validar();

    const viaje = new Viaje({
      cliente_id: dto.cliente_id,
      origen: dto.origen,
      destino: { lat: 0, lng: 0 }, 
      tipo_vehiculo: dto.tipo_vehiculo,
      estado: 'borrador',
      monto_ruta: 0
    });

    const creado = await this.viajeRepository.crear(viaje);
    return new LinkWhatsappDto(creado);
  }
}
