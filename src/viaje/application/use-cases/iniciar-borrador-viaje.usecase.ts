import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { IniciarViajeInDto } from '../dto/in/iniciar-viaje.in.dto';
import { LinkWhatsappDto } from '../dto/out/link-whatsapp.dto';
import { IClienteRepository } from '../../../cliente/domain/cliente.repository';

export class IniciarBorradorViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private clienteRepository: IClienteRepository
  ) {}

  async execute(dto: IniciarViajeInDto): Promise<LinkWhatsappDto> {
    dto.validar();

    // GENERACIÓN OFICIAL DEL PIN (Regla: 2 últimos dígitos del teléfono)
    const cliente = await this.clienteRepository.buscarPorId(dto.cliente_id);
    const telefono = cliente?.telefono || '';
    const pin = telefono.replace(/\D/g, '').slice(-2).padStart(2, '0');

    const viaje = new Viaje({
      cliente_id: dto.cliente_id,
      origen: dto.origen,
      destino: { lat: 0, lng: 0 }, 
      tipo_vehiculo: dto.tipo_vehiculo,
      estado: 'borrador',
      monto_ruta: 0,
      pin_verificacion: pin
    });

    const creado = await this.viajeRepository.crear(viaje);
    return new LinkWhatsappDto(creado);
  }
}
