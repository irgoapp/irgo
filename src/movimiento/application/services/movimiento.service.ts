import { IMovimientoRepository } from '../../domain/movimiento.repository';
import { Movimiento } from '../../domain/movimiento.entity';
import * as crypto from 'crypto';

export class MovimientoService {
  constructor(private movimientoRepo: IMovimientoRepository) {}

  /**
   * procesarCobroComision
   * Descuenta del saldo y registra la transacción de tipo cobro_solicitud
   */
  async procesarCobroComision(conductorId: string, solicitudId: string, montoComision: number): Promise<void> {
    const saldo_antes = await this.movimientoRepo.obtenerSaldo(conductorId);
    
    if (saldo_antes < montoComision) {
      throw new Error(`Saldo insuficiente. Requieres Bs. ${montoComision} para este viaje.`);
    }

    const saldo_despues = Number((saldo_antes - montoComision).toFixed(2));
    const transaccionId = crypto.randomUUID();
    const shortId = transaccionId.split('-').pop(); // Tomamos los últimos 12 caracteres

    const movimiento = new Movimiento({
      id: transaccionId,
      conductor_id: conductorId,
      solicitud_id: solicitudId,
      tipo: 'cobro_solicitud',
      monto: -Math.abs(montoComision),
      saldo_antes,
      saldo_despues,
      descripcion: `Cobro comision (${shortId})`
    });

    await this.movimientoRepo.actualizarSaldo(conductorId, saldo_despues);
    await this.movimientoRepo.registrarTransaccion(movimiento);
  }

  /**
   * procesarReembolsoComision
   * Devuelve el monto cobrado previamente si el viaje se cancela
   */
  async procesarReembolsoComision(conductorId: string, solicitudId: string): Promise<void> {
    // 1. Buscar el cobro original
    const cobroOriginal = await this.movimientoRepo.buscarPorSolicitudYTipo(solicitudId, 'cobro_solicitud');
    
    if (!cobroOriginal) {
      console.warn(`[MovimientoService] No se encontró cobro previo para reembolsar en solicitud: ${solicitudId}`);
      return;
    }

    const montoAReembolsar = Math.abs(cobroOriginal.monto);
    const saldo_antes = await this.movimientoRepo.obtenerSaldo(conductorId);
    const saldo_despues = Number((saldo_antes + montoAReembolsar).toFixed(2));
    
    const transaccionId = crypto.randomUUID();
    const shortId = transaccionId.split('-').pop();

    const movimiento = new Movimiento({
      id: transaccionId,
      conductor_id: conductorId,
      solicitud_id: solicitudId,
      tipo: 'ajuste',
      monto: montoAReembolsar,
      saldo_antes,
      saldo_despues,
      descripcion: `Reembolso comision (${shortId})`
    });

    await this.movimientoRepo.actualizarSaldo(conductorId, saldo_despues);
    await this.movimientoRepo.registrarTransaccion(movimiento);
  }

  /**
   * procesarRecarga
   * Incrementa el saldo por una recarga manual o externa
   */
  async procesarRecarga(conductorId: string, monto: number, descripcionPersonalizada?: string): Promise<void> {
    const saldo_antes = await this.movimientoRepo.obtenerSaldo(conductorId);
    const saldo_despues = Number((saldo_antes + monto).toFixed(2));
    
    const transaccionId = crypto.randomUUID();
    const shortId = transaccionId.split('-').pop();

    const movimiento = new Movimiento({
      id: transaccionId,
      conductor_id: conductorId,
      tipo: 'recarga_saldo',
      monto: monto,
      saldo_antes,
      saldo_despues,
      descripcion: descripcionPersonalizada || `Recarga transaccion (${shortId})`
    });

    await this.movimientoRepo.actualizarSaldo(conductorId, saldo_despues);
    await this.movimientoRepo.registrarTransaccion(movimiento);
  }

  async consultarBilletera(conductorId: string): Promise<{ saldo: number, movimientos: Movimiento[] }> {
    const saldo = await this.movimientoRepo.obtenerSaldo(conductorId);
    const movimientos = await this.movimientoRepo.obtenerHistorial(conductorId, 20);
    return { saldo, movimientos };
  }
}
