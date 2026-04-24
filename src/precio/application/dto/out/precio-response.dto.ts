export class PrecioResponseDto {
  precio_estimado: number;
  moneda: string;

  constructor(precio_estimado: number, moneda: string = 'USD') {
    this.precio_estimado = precio_estimado;
    this.moneda = moneda;
  }
}
