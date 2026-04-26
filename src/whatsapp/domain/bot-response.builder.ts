/**
 * BotResponseBuilder
 * CENTRALIZA todos los textos y mensajes interactivos del bot de WhatsApp.
 */

export interface TextMessage {
  type: 'text';
  text: { body: string; preview_url?: boolean };
}

export interface InteractiveMessage {
  type: 'interactive';
  interactive: any; 
}

export type WaMessage = TextMessage | InteractiveMessage;

export class BotResponseBuilder {

  static bienvenida(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: 'IrGo - Elige tu Servicio',
        },
        body: {
          text: '¡Bienvenido! ¿Cómo deseas moverte hoy?\n\nSelecciona una opción para comenzar:',
        },
        footer: { text: 'IrGo & Taxi Libre' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'pedir_moto', title: '🛵 Moto' } },
            { type: 'reply', reply: { id: 'pedir_auto', title: '🚗 Auto' } },
            { type: 'reply', reply: { id: 'pedir_delivery', title: '📦 Delivery' } },
          ],
        },
      },
    };
  }

  static pedirUbicacion(): TextMessage {
    return {
      type: 'text',
      text: {
        body:
          '📍 *Comparte tu ubicación de recogida*\n\n' +
          'Toca el clip 📎 → *Ubicación* → *Enviar mi ubicación actual*.\n\n' +
          '_Solo tarda 2 segundos_ 😊',
      },
    };
  }

  static linkParaDestino(link: string): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: {
          text:
            '✅ *¡Ubicación recibida!*\n\n' +
            'Ahora selecciona tu destino en el mapa para calcular la tarifa al instante:',
        },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: '🗺️ Elegir Destino',
            url: link
          }
        },
        footer: { text: 'Taxi Libre — Tu viaje seguro' },
      } as any,
    };
  }

  static confirmandoBusqueda(): TextMessage {
    return {
      type: 'text',
      text: {
        body: '🚀 *¡Solicitud recibida!* Buscando conductor... 🔔',
      },
    };
  }

  static cancelacionConfirmada(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: 'Viaje cancelado. ¿Deseas pedir otra moto?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'pedir_moto', title: 'Pedir Moto' } },
          ],
        },
      },
    };
  }
}