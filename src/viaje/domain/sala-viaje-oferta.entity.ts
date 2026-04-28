export class SalaViajeOferta {
  id?: string;
  viaje_id: string;
  enviado_conductores_id: string[];
  numero_conductores: number;
  conductor_id?: string;
  cliente_id: string;
  estado_oferta: 'enviada' | 'aceptada' | 'completada' | 'cancelada';
  created_at?: Date;
  updated_at?: Date;

  constructor(data: Partial<SalaViajeOferta>) {
    this.id = data.id;
    this.viaje_id = data.viaje_id!;
    this.enviado_conductores_id = data.enviado_conductores_id || [];
    this.numero_conductores = data.numero_conductores || this.enviado_conductores_id.length;
    this.conductor_id = data.conductor_id;
    this.cliente_id = data.cliente_id!;
    this.estado_oferta = data.estado_oferta || 'enviada';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}
