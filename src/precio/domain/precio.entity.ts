export class Precio {
  id?: string;
  tipo_vehiculo: string;
  precio_base: number;
  precio_km: number;
  precio_minuto: number;

  constructor(data: Partial<Precio>) {
    this.id = data.id;
    this.tipo_vehiculo = data.tipo_vehiculo!;
    this.precio_base = data.precio_base!;
    this.precio_km = data.precio_km!;
    this.precio_minuto = data.precio_minuto!;
  }
}
