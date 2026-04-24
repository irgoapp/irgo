export class Viaje {
  id?: string;
  cliente_id: string;
  conductor_id?: string;
  origen: { lat: number; lon: number };
  destino: { lat: number; lon: number };
  destino_texto?: string;
  tipo_vehiculo: string;
  precio?: number;
  distancia_km?: number;
  estado: string;
  creado_en: Date;

  constructor(data: Partial<Viaje>) {
    this.id = data.id;
    this.cliente_id = data.cliente_id!;
    this.conductor_id = data.conductor_id;
    this.origen = data.origen!;
    this.destino = data.destino!;
    this.destino_texto = data.destino_texto;
    this.tipo_vehiculo = data.tipo_vehiculo!;
    this.precio = data.precio;
    this.distancia_km = data.distancia_km;
    this.estado = data.estado || 'solicitado';
    this.creado_en = data.creado_en || new Date();
  }
}
