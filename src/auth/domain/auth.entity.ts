export class AuthSession {
  token: string;
  conductor_id: string;
  perfil?: any;

  constructor(data: Partial<AuthSession>) {
    this.token = data.token!;
    this.conductor_id = data.conductor_id!;
    this.perfil = data.perfil;
  }
}
