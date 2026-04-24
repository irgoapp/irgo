import { Cliente } from './cliente.entity';

export interface IClienteRepository {
  buscarPorTelefono(telefono: string): Promise<Cliente | null>;
  buscarPorId(id: string): Promise<Cliente | null>;
  crear(cliente: Cliente): Promise<Cliente>;
}
