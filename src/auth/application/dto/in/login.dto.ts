export class LoginDto {
  telefono: string;
  password?: string;

  constructor(data: any) {
    this.telefono = data.telefono || data.usuario;
    this.password = data.password;
  }

  validar() {
    if (!this.telefono || !this.password) throw new Error('Telefono y password requeridos');
  }
}
