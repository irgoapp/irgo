# DOCUMENTACIÓN IRGO BACKEND

Este documento detalla el funcionamiento técnico, arquitectónico y de negocio del servidor central de IRGO. El sistema actúa como el motor soberano que orquestra la comunicación entre pasajeros (WhatsApp), conductores (App Android/PWA) y la base de datos (Supabase).

---

## 1. Stack Tecnológico

El proyecto está construido sobre **Node.js** utilizando el framework **Fastify** para alta eficiencia en peticiones I/O.

### Dependencias Principales (`package.json`)
*   **fastify**: Framework web principal, elegido por su bajo overhead y sistema de plugins.
*   **socket.io**: Motor de comunicación bidireccional en tiempo real para telemetría GPS y ofertas de viaje.
*   **@supabase/supabase-js**: Cliente oficial para la gestión de datos, autenticación y almacenamiento.
*   **@fastify/cors**: Habilita el intercambio de recursos entre distintos dominios (APK y PWA).
*   **@fastify/rate-limit**: Protección contra ataques de fuerza bruta o saturación de endpoints.
*   **typescript**: Lenguaje base para asegurar la integridad de los contratos de datos (DTOs).
*   **ts-node / nodemon**: Herramientas de desarrollo para ejecución y recarga automática.

---

## 2. Arquitectura

El backend sigue un patrón de **Arquitectura Limpia (Clean Architecture)** organizada por **Dominios Funcionales**.

### Estructura de Carpetas
Cada carpeta en `src/` representa un dominio de negocio:
*   `presentation/`: Controladores Fastify y Webhooks (Entrada del sistema).
*   `application/`: Casos de uso (Lógica de negocio pura) y DTOs (Data Transfer Objects).
*   `domain/`: Entidades de negocio e interfaces de repositorios (Contratos).
*   `infrastructure/`: Implementaciones técnicas (Supabase, APIs externas como Meta o Maps).
*   `shared/`: Utilidades comunes, manejador de errores y cliente centralizado de Supabase.

### Flujo de una Petición
1.  **Entrada**: Llega al `controller` (Presentation).
2.  **Validación**: Se mapea a un `DTO` que valida los campos.
3.  **Lógica**: Se invoca un `UseCase` (Application).
4.  **Datos**: El `UseCase` utiliza un `Repository` (Infrastructure) para interactuar con Supabase.
5.  **Respuesta**: El `UseCase` devuelve una entidad o DTO de respuesta al `controller`, que entrega el JSON final.

---

## 3. Endpoints Disponibles

### Dominio: Auth (`/api/auth` o `/auth`)
| Método | Ruta | Auth | Recibe | Devuelve | Propósito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/login` | No | `telefono`, `password` | `AuthSession` | Inicia sesión del conductor. |
| GET | `/verificar` | Sí | `Bearer Token` | `{ok, conductor_id}` | Valida si el token actual es vigente. |

### Dominio: Viaje (`/api/viaje` o `/viaje`)
| Método | Ruta | Auth | Recibe | Devuelve | Propósito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/` | No | `cliente_id`, `origen` | `Viaje` | Crea un borrador de viaje (Punto A). |
| GET | `/:id` | No | `id` | `Viaje` | Obtiene detalles de un viaje. |
| POST | `/:id/confirmar` | No | `destino`, `destino_texto` | `Viaje` | El cliente confirma destino y se inicia búsqueda. |
| POST | `/:id/aceptar` | Sí | `conductor_id` | `Viaje` | Conductor toma el viaje disponible. |
| POST | `/:id/cancelar` | No | `motivo` | `{ok}` | Cancela el viaje (cliente o sistema). |
| POST | `/:id/llegue` | Sí | - | `Viaje` | Conductor notifica llegada al punto A. |
| POST | `/:id/iniciar` | Sí | `pin` | `Viaje` | Inicia trayecto al punto B (valida PIN). |
| POST | `/:id/calificar`| No | `rating` | `{ok}` | Cliente califica al conductor (1-5). |
| POST | `/cotizar` | No | `origen`, `destino`, `tipo`| `Cotizacion` | Calcula precio estimado sin crear viaje. |
| POST | `/:id/chat` | Sí | `contenido` | `{ok}` | Conductor envía mensaje al pasajero. |

### Dominio: Conductor (`/api/conductor` o `/conductor`)
| Método | Ruta | Auth | Recibe | Devuelve | Propósito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PUT | `/:id/ubicacion` | Sí | `lat`, `lng` | `{ok}` | Actualiza posición GPS en base de datos. |
| GET | `/:id/historial` | Sí | - | `Viaje[]` | Últimos 50 viajes realizados por el conductor. |
| PUT | `/:id/disponibilidad`| Sí | `disponible` | `{ok}` | Conecta/Desconecta al conductor del marketplace. |

### Otros
*   **Config**: `GET /api/config/version` -> Retorna versión mínima de la APK requerida.
*   **Movimiento**: `GET /api/movimiento/billetera/:id` -> Saldo y transacciones.
*   **WhatsApp**: `POST /whatsapp/webhook` -> Recepción de mensajes de clientes.

---

## 4. Eventos Socket.io

La comunicación en tiempo real es vital para la APK del conductor y la sincronización del estado del viaje.

| Evento | Dirección | Datos | Propósito |
| :--- | :--- | :--- | :--- |
| `actualizar_ubicacion` | D → B | `{lat, lng}` | Actualización frecuente de GPS del conductor para matching. |
| `join_trip` | D/C → B | `tripId` | Une el socket a la sala del viaje para recibir actualizaciones. |
| `oferta_viaje` | B → D | `OfertaDTO` | Notifica a un conductor de un nuevo viaje cercano disponible. |
| `trip_updated` | B → C | `Viaje` | Notifica al cliente web/PWA cambios de estado del viaje. |
| `viaje_tomado_por_otro`| B → D | `{viaje_id}` | Cierra el modal de oferta en conductores que no ganaron la puja. |
| `viaje_cancelado_por_cliente`| B → D | `{viaje_id}` | Notifica al conductor asignado que el cliente canceló el servicio. |
| `limpiar_oferta` | B → D | `{viaje_id}` | Elimina una oferta específica de la pantalla del conductor. |
| `viaje_expirado` | B → C | `{viaje_id}` | Notifica al cliente que no se encontraron conductores a tiempo. |
| `chat:nuevo_mensaje` | B → D | `Mensaje` | Envía mensaje del pasajero (desde WhatsApp) a la APK. |

---

## 5. Tablas de Supabase Utilizadas

El sistema utiliza el esquema público de Supabase con extensiones de **PostGIS** para cálculos geoespaciales.

*   **`solicitudes`**: Tabla maestra de viajes. Registra origen/destino, montos, estados, rutas (GeoJSON) y PIN.
*   **`conductores`**: Perfiles, estado de conexión (`disponible`), tipo de vehículo y ubicación geográfica (`Geography`).
*   **`clientes`**: Base de datos de pasajeros registrados automáticamente al usar el bot.
*   **`tarifas`**: Matriz de precios por categoría (Moto, Auto, Delivery) con cargos base y por KM.
*   **`viaje_mensajes`**: Historial de chat interno entre conductor y cliente para auditoría.
*   **`wsp_sessions`**: Almacena el estado de la máquina de estados del bot de WhatsApp por cada teléfono.
*   **`movimientos`**: Libro contable de créditos, comisiones cobradas y recargas manuales.
*   **`versiones`**: Gestión de mantenimiento y versiones mínimas para `irgo-driver`.

---

## 6. Variables de Entorno

| Variable | Descripción | Requerida |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Endpoint de tu proyecto Supabase. | **SÍ** |
| `SUPABASE_SERVICE_KEY` | Service Role Key (Bypass RLS) para uso en backend. | **SÍ** |
| `META_ACCESS_TOKEN` | Token permanente de la Cloud API de WhatsApp. | **SÍ** |
| `META_PHONE_NUMBER_ID` | ID único del número emisor en Meta. | **SÍ** |
| `META_WEBHOOK_VERIFY_TOKEN`| Token secreto configurado en el Dashboard de Meta. | **SÍ** |
| `PORT` | Puerto de escucha (Railway asigna uno dinámico). | No |
| `MAPS_API_URL` | URL del microservicio `taxlibre-maps-api`. | **SÍ** |

---

## 7. Flujos de Negocio Completos

### A. Inicio de Sesión del Conductor
1. El conductor ingresa teléfono y contraseña en la APK.
2. El backend busca en la tabla `auth.users` y devuelve un JWT.
3. El backend extrae el perfil de `conductores` y crea una `AuthSession`.
4. La APK guarda el token y comienza a emitir GPS vía Sockets.

### B. Ciclo de Vida de un Viaje (Marketplace)
1. **Solicitud**: Cliente envía ubicación. Se crea un `borrador` con precio estimado.
2. **Confirmación**: Cliente confirma. El viaje pasa a `buscando`.
3. **Matching**: El sistema identifica a los 20 conductores más cercanos (5km) con saldo > comisión.
4. **Oferta**: Se envía la oferta por Socket a esos 20 conductores.
5. **Aceptación**: El primer conductor en responder "Aceptar" bloquea el viaje para sí mismo.
6. **Ejecución**: Conductor llega (Llegado), valida PIN (En curso) y finaliza (Completado).

### C. Bot de WhatsApp (Asistente de Pedidos)
1. **Inicio**: El cliente escribe. Si no tiene sesión, se inicia el flujo de bienvenida.
2. **Vehículo**: Cliente elige entre Moto, Auto o Delivery.
3. **Ubicación**: Cliente comparte su ubicación de WhatsApp. El bot genera la cotización.
4. **Confirmación**: Al aceptar, el bot monitorea el estado del viaje y notifica cambios al cliente.

---

## 8. Reglas de Negocio Críticas

### Cálculo del Precio (Tarifador)
El precio final es **Soberanía del Backend** y se calcula sumando:
- Tarifa base por tipo de vehículo.
- (Distancia en KM) * (Precio por KM de la tarifa).
- Comisión de plataforma (fija + variable por KM).
- Si el total es menor a la **Tarifa Mínima**, se aplica la mínima.

### Sistema de Matching (Matching Engine)
- **Radio de Búsqueda**: Inicialmente 5km a la redonda.
- **Límite de Ofertas**: Se notifican máximo a 20 conductores simultáneamente.
- **Validación de Billetera**: Un conductor con saldo insuficiente para la comisión no ve la oferta.

### Seguridad y Validación
- **PIN de Seguridad**: El viaje solo puede pasar a "En curso" si el conductor ingresa el PIN de 4 dígitos generado para el cliente.
- **Bloqueo Atómico**: Se evita que dos conductores acepten el mismo viaje mediante una validación de estado `buscando` en la actualización de la DB.

---
*Documentación generada automáticamente por Antigravity para el proyecto IRGO - 2026*
