export class Movimiento {
  id: string;
  conductor_id: string;
  solicitud_id?: string;
  tipo: 'cobro_solicitud' | 'recarga_saldo' | 'ajuste';
  monto: number;
  saldo_antes: number;
  saldo_despues: number;
  descripcion: string;
  created_at?: Date;

  constructor(data: Partial<Movimiento>) {
    this.id = data.id!;
    this.conductor_id = data.conductor_id!;
    this.solicitud_id = data.solicitud_id;
    this.tipo = data.tipo!;
    this.monto = data.monto!;
    this.saldo_antes = data.saldo_antes || 0;
    this.saldo_despues = data.saldo_despues || 0;
    this.descripcion = data.descripcion || '';
    this.created_at = data.created_at;
  }
}
