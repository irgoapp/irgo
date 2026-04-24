import { AuthSession } from './auth.entity';

export interface IAuthRepository {
  loginConductor(usuario: string, passwordHash: string): Promise<AuthSession | null>;
}
