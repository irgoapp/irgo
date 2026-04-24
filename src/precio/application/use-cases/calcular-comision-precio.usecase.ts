export class CalcularComisionPrecioUseCase {
  constructor() {}

  async execute(dto: { precio_total: number }): Promise<number> {
    // Ejemplo de un UseCase muy específico
    return dto.precio_total * 0.15; // 15% de comisión
  }
}
