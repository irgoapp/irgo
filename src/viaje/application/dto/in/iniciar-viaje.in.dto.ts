export class IniciarViajeInDto {
  cliente_id: string;
  origen: { lat: number; lng: number };
  tipo_vehiculo: string;

  constructor(data: any) {
    this.cliente_id = data.cliente_id;
    this.origen = data.origen;
    this.tipo_vehiculo = data.tipo_vehiculo || 'moto';
  }

  validar() {
    if (!this.cliente_id) throw new Error('ID de cliente es obligatorio');
    if (!this.origen?.lat || !this.origen?.lng) throw new Error('Cordenadas de origen obligatorias');
  }
}
