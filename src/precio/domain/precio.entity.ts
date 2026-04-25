export class Precio {
  id?: string;
  tipo_vehiculo: string;
  precio_por_km: number;
  tarifa_minima_bs: number;
  comision_por_solicitud: number;
  comision_por_km: number;
  comision_solicitud_minima: number;
  comision_porcentaje: number;

  constructor(data: Partial<Precio>) {
    this.id = data.id;
    this.tipo_vehiculo = data.tipo_vehiculo || 'moto';
    this.precio_por_km = data.precio_por_km || 0;
    this.tarifa_minima_bs = data.tarifa_minima_bs || 0;
    this.comision_por_solicitud = data.comision_por_solicitud || 0;
    this.comision_por_km = data.comision_por_km || 0;
    this.comision_solicitud_minima = data.comision_solicitud_minima || 0;
    this.comision_porcentaje = data.comision_porcentaje || 0;
  }
}
