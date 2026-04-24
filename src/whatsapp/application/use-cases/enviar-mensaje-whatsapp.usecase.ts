import { IWhatsappRepository } from '../../domain/whatsapp.repository';
import { MensajeWhatsapp } from '../../domain/whatsapp.entity';

export class EnviarMensajeWhatsappUseCase {
  constructor(private whatsappRepository: IWhatsappRepository) {}

  async execute(dto: { telefono: string; texto: string; plantilla?: string }): Promise<boolean> {
    if (!dto.telefono) throw new Error('Telefono requerido');
    return await this.whatsappRepository.enviarMensaje(new MensajeWhatsapp(dto));
  }
}
