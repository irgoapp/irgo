import { IClienteRepository } from '../../domain/cliente.repository';
import { Cliente } from '../../domain/cliente.entity';

export class GetOrCreateClienteUseCase {
  constructor(private clienteRepository: IClienteRepository) {}

  async execute(dto: { telefono: string; nombre?: string }): Promise<Cliente> {
    const limpio = dto.telefono.replace(/\D/g, ''); // Limpiar el numero

    let cliente = await this.clienteRepository.buscarPorTelefono(limpio);
    
    if (!cliente) {
      cliente = new Cliente({
        telefono: limpio,
        nombre: dto.nombre || 'Cliente Nuevo',
      });
      cliente = await this.clienteRepository.crear(cliente);
    }
    
    return cliente;
  }
}
