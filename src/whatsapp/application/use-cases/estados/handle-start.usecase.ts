import { IWhatsappRepository } from '../../../domain/whatsapp.repository';
import { IClienteRepository } from '../../../../cliente/domain/cliente.repository';
import { GetOrCreateClienteUseCase } from '../../../../cliente/application/use-cases/get-or-create-cliente.usecase';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';

export class HandleStartUseCase {
  constructor(
    private whatsappRepo: IWhatsappRepository,
    private clienteRepo: IClienteRepository
  ) {}

  async execute(telefono: string): Promise<void> {
    console.log(`[HandleStart] Enviando bienvenida a ${telefono}`);
    
    // 1. Aseguramos que el cliente exista en DB
    const creator = new GetOrCreateClienteUseCase(this.clienteRepo);
    await creator.execute({ telefono });

    // 2. Enviaremos el mensaje de bienvenida con BOTONES
    await this.whatsappRepo.enviarMensaje({
      telefono,
      texto: BotResponseBuilder.mensajeBienvenida()
    });
  }
}
