import { IAuthRepository } from '../../domain/auth.repository';
import { AuthSession } from '../../domain/auth.entity';
import { LoginDto } from '../dto/in/login.dto';

export class LoginAuthUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(dto: LoginDto): Promise<AuthSession> {
    dto.validar();
    const session = await this.authRepository.loginConductor(dto.telefono, dto.password!);
    if (!session) throw new Error('Credenciales inválidas');
    return session;
  }
}
