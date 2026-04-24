export class CerrarViajeDto {
  viaje_id: string;
  conductor_id: string;

  constructor(data: any) {
    this.viaje_id = data.viaje_id;
    this.conductor_id = data.conductor_id;
  }

  validar() {
    if (!this.viaje_id) throw new Error('viaje_id requerido');
    if (!this.conductor_id) throw new Error('conductor_id requerido');
  }
}
