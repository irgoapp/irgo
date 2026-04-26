# DOCUMENTACIÓN DE CONTRATOS - IRGO BACKEND

Este documento resume los endpoints, DTOs y tablas de base de datos del sistema IrGo Backend.

---

## DOMINIO: VIAJE

### Endpoints:

- **POST `/viaje/`** (Solicitar Viaje)
  - **Recibe**: `cliente_id` (string), `origen_lat` (number), `origen_lng` (number), `origen_texto` (string?), `destino_lat` (number), `destino_lng` (number), `destino_texto` (string?), `tipo_vehiculo` (string)
  - **Devuelve**: Objeto Viaje (id, cliente_id, estado, origen, destino, etc.)

- **POST `/viaje/cotizar`** (Cotización Maestra)
  - **Recibe**: `origen` {lat, lng}, `destino` {lat, lng}, `tipo` (string: 'moto' | 'auto')
  - **Devuelve**: `monto_ruta` (number), `distancia_ruta` (number), `tiempo_ruta` (number), `ruta` (GeoJSON)

- **POST `/viaje/:id/confirmar`** (Confirmación Cliente)
  - **Recibe**: `viaje_id` (string), `destino_lat` (number), `destino_lng` (number), `destino_texto` (string), `monto_ruta` (number), `distancia_ruta` (number), `tiempo_ruta` (number)
  - **Devuelve**: Objeto Viaje actualizado.

- **POST `/viaje/:id/aceptar`** (Aceptación Conductor)
  - **Recibe**: `conductor_id` (string) en el body.
  - **Devuelve**: Objeto Viaje actualizado.

- **POST `/viaje/:id/cancelar`**
  - **Recibe**: `motivo` (string)
  - **Devuelve**: `{ ok: boolean }`

- **POST `/viaje/:id/llegue`**
  - **Devuelve**: Objeto Viaje con estado 'llegado'.

### Tabla en Supabase: `solicitudes`
- **Columnas**: `id`, `cliente_id`, `conductor_id`, `origen` (Geography), `origen_lat`, `origen_lng`, `origen_texto`, `destino_lat`, `destino_lng`, `destino_texto`, `monto_ruta` (Bs), `distancia_ruta` (KM), `tiempo_ruta` (Min), `tipo_vehiculo`, `estado`, `ruta` (JSONB), `ruta_recogida` (JSONB), `buscando_at`, `asignado_at`, `llegado_at`, `iniciado_at`, `completado_at`, `cancelado_at`.

---

## DOMINIO: CONDUCTOR

### Endpoints:

- **PUT `/conductor/:id/ubicacion`**
  - **Recibe**: `lat` (number), `lng` (number)
  - **Devuelve**: `{ success: true }`

- **GET `/conductor/:id/ubicacion`**
  - **Devuelve**: `{ lat: number, lng: number }`

- **PUT `/conductor/:id/disponibilidad`**
  - **Recibe**: `disponible` (boolean/string/number)
  - **Devuelve**: `{ ok: true, disponible: boolean }`

- **GET `/conductor/:id/historial`**
  - **Devuelve**: Lista de viajes (id, origen_texto, destino_texto, monto_ruta, etc.)

### Tabla en Supabase: `conductores`
- **Columnas**: `id`, `disponible` (boolean), `tipo_vehiculo` ('moto' | 'auto'), `ubicacion` (Geography), `ultima_ubicacion_at`.

---

## DOMINIO: PRECIO

### Endpoints:

- **POST `/precio/calcular`**
  - **Recibe**: `distancia_ruta` (number), `tiempo_ruta` (number), `tipo_vehiculo` (string)
  - **Devuelve**: Precio (number), `moneda` ('USD' default).

### Tabla en Supabase: `tarifas`
- **Columnas**: `id`, `tipo_vehiculo`, `precio_por_km`, `tarifa_minima_bs`, `comision_por_solicitud`, `comision_por_km`, `comision_solicitud_minima`.

---

## DOMINIO: MAPA

### Endpoints:

- **POST `/mapa/ruta`**
  - **Recibe**: `origen` {lat, lng}, `destino` {lat, lng}
  - **Devuelve**: Objeto Mapa con `distancia_ruta`, `tiempo_ruta`, `geojson`.

---

## DOMINIO: WHATSAPP

### Endpoints:

- **GET `/whatsapp/webhook`** (Verificación)
  - **Parámetros Hub**: `hub.mode`, `hub.verify_token`, `hub.challenge`.

- **POST `/whatsapp/webhook`** (Recepción)
  - **Recibe**: Payload dinámico de Meta (text, location, interactive).

### Tabla en Supabase: `sesiones_whatsapp`
- **Columnas**: `telefono` (PK), `estado`, `contexto` (JSONB), `ultima_actividad`.

---

## DOMINIO: CLIENTE

### Endpoints:

- **POST `/cliente/auth/whatsapp`**
  - **Recibe**: `telefono` (string), `nombre` (string)
  - **Devuelve**: Objeto Cliente (id, nombre, telefono).

### Tabla en Supabase: `clientes`
- **Columnas**: `id`, `nombre`, `telefono`, `calificacion`.
