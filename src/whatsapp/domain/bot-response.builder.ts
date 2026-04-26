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

  static mensajeBienvenida(): InteractiveMessage {
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
        footer: { text: 'IrGo' },
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

  static mensajePedirUbicacion(): TextMessage {
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

  static mensajeLinkDestino(link: string): InteractiveMessage {
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
        footer: { text: 'IrGo — Tu viaje seguro' },
      } as any,
    };
  }

  static mensajeConfirmacionViaje(destino: string): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `🏁 *Destino seleccionado:*\n${destino}\n\n¿Confirmamos tu viaje en IrGo ahora?`,
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'confirmar_si', title: '✅ Sí, confirmar' } },
            { type: 'reply', reply: { id: 'confirmar_no', title: '❌ Cancelar' } },
          ],
        },
      },
    };
  }

  static mensajeBuscandoConductor(): TextMessage {
    return {
      type: 'text',
      text: {
        body: '🚀 *¡Solicitud recibida!* Buscando conductor en IrGo... 🔔',
      },
    };
  }

  static mensajeBusquedaEnProgreso(): TextMessage {
    return {
      type: 'text',
      text: {
        body: '🔍 Seguimos buscando tu conductor en IrGo... Te avisamos de inmediato, no hace falta que escribas nada.',
      },
    };
  }

  static mensajeConductorAsignado(params: {
    conductor: any;
    etaMinutos: number;
    pin: string;
  }): TextMessage {
    const { conductor, etaMinutos, pin } = params;
    return {
      type: 'text',
      text: {
        body:
          `🚗 *¡CONDUCTOR ASIGNADO EN IRGO!*\n\n` +
          `👤 *Conductor:* ${conductor.nombre}\n` +
          `🚗 *Vehículo:* ${conductor.vehiculo_marca ?? ''} ${conductor.vehiculo_modelo ?? ''} — ${conductor.vehiculo_color ?? ''}\n` +
          `🔢 *Placa:* ${conductor.vehiculo_placa ?? ''}\n\n` +
          `⏱️ *Llega en:* ~${etaMinutos} min\n` +
          `🔐 *PIN de verificación:* *${pin}*\n\n` +
          `_Espera en tu punto de recogida. El conductor ya está en camino._`,
      },
    };
  }

  static mensajeSinConductores(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: '😔 *No hay conductores disponibles* en tu zona en este momento.\n\n¿Qué deseas hacer?',
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'reintentar', title: '🔄 Reintentar' } },
            { type: 'reply', reply: { id: 'cancelar', title: '❌ Cancelar' } },
          ],
        },
      },
    };
  }

  static mensajeCalificarViaje(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: '⭐ *¿Cómo estuvo tu viaje con IrGo?*\n\nTu opinión nos ayuda a mejorar el servicio.' },
        footer: { text: 'Toca "Ver opciones" para calificar' },
        action: {
          button: 'Ver opciones',
          sections: [
            {
              title: 'Califica tu experiencia',
              rows: [
                { id: 'cal_5', title: '⭐⭐⭐⭐⭐ Excelente', description: 'Todo perfecto' },
                { id: 'cal_4', title: '⭐⭐⭐⭐ Muy bueno', description: 'Casi perfecto' },
                { id: 'cal_3', title: '⭐⭐⭐ Bueno', description: 'Aceptable' },
                { id: 'cal_2', title: '⭐⭐ Regular', description: 'Tuvo algunos problemas' },
                { id: 'cal_1', title: '⭐ Malo', description: 'Mala experiencia' },
              ],
            },
          ],
        },
      },
    };
  }

  static mensajeGraciasCalificacion(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: '🙏 *¡Gracias por tu calificación!*\n\nTu opinión nos ayuda a darte un mejor servicio en IrGo.',
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'pedir_moto', title: '🛵 Nuevo Viaje' } },
          ],
        },
      },
    };
  }

  static mensajeCancelacionConfirmada(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: 'Viaje cancelado en IrGo. ¿Deseas pedir otro servicio?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'pedir_moto', title: 'Pedir Servicio' } },
          ],
        },
      },
    };
  }

  static mensajeDestinoConfirmado(): TextMessage {
    return {
      type: 'text',
      text: {
        body: '🏁 *¡Destino confirmado en IrGo!* Contactando al conductor más cercano. Mantén el chat abierto. 📲',
      },
    };
  }

  static mensajeError(): InteractiveMessage {
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: '⚠️ Algo salió mal en IrGo. ¿Quieres empezar de nuevo?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'pedir_moto', title: '🔄 Reiniciar' } },
          ],
        },
      },
    };
  }
}