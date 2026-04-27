/**
 * Interfaz para consultar viajes activos desde el módulo WhatsApp.
 * El bot necesita saber si el cliente tiene un viaje en curso
 * para decidir entre Rama 1 (Creación) y Rama 2 (Viaje Activo).
 */
export interface IViajeLookupRepository {
  buscarViajeActivoPorCliente(clienteId: string): Promise<any | null>;
}
