export class Viaje {
  id?: string;
  cliente_id: string;
  conductor_id?: string;
  origen: { lat: number; lon: number };
  origen_texto?: string;
  destino: { lat: number; lon: number };
  destino_texto?: string;
  tipo_vehiculo: string;
  precio?: number;
  distancia_km?: number;
  estado: string;
  creado_en: Date;
  buscando_at?: Date;
  asignado_at?: Date;
  llegado_at?: Date;
  iniciado_at?: Date;
  completado_at?: Date;
  cancelado_at?: Date;

  constructor(data: Partial<Viaje>) {
    this.id = data.id;
    this.cliente_id = data.cliente_id!;
    this.conductor_id = data.conductor_id;
    this.origen = data.origen!;
    this.origen_texto = data.origen_texto;
    this.destino = data.destino!;
    this.destino_texto = data.destino_texto;
    this.tipo_vehiculo = data.tipo_vehiculo!;
    this.precio = data.precio;
    this.distancia_km = data.distancia_km;
    this.estado = data.estado || 'solicitado';
    this.creado_en = data.creado_en || new Date();
    this.buscando_at = data.buscando_at ? new Date(data.buscando_at) : undefined;
    this.asignado_at = data.asignado_at ? new Date(data.asignado_at) : undefined;
    this.llegado_at = data.llegado_at ? new Date(data.llegado_at) : undefined;
    this.iniciado_at = data.iniciado_at ? new Date(data.iniciado_at) : undefined;
    this.completado_at = data.completado_at ? new Date(data.completado_at) : undefined;
    this.cancelado_at = data.cancelado_at ? new Date(data.cancelado_at) : undefined;
  }
}
