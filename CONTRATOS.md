# CONTRATOS DE COMUNICACIÓN IRGO-BACKEND

Este documento detalla los endpoints de la API y los eventos de Sockets actualmente operativos, con sus nombres de parámetros exactos para asegurar la compatibilidad entre el Backend, la App Cliente y la App Conductor.

---

## 🚕 MÓDULO DE VIAJES (`/viaje`)

### 💰 Cotizar Viaje
*   **Endpoint**: `POST /viaje/cotizar`
*   **Body**: 
    ```json
    {
      "origen": { "lat": number, "lon": number },
      "destino": { "lat": number, "lon": number },
      "tipo": string (ej: "basico", "moto", "auto")
    }
    ```
*   **Respuesta**: 
    ```json
    {
      "monto": number,
      "distancia_km": number,
      "tiempo_minutos": number,
      "ruta": GeoJSON_Object
    }
    ```

### ✅ Confirmar y Solicitar Viaje (Cliente)
*   **Endpoint**: `POST /viaje/:id/confirmar`
*   **Body**: 
    ```json
    {
      "destino_lat": number,
      "destino_lng": number,
      "destino_texto": string,
      "monto": number,
      "distancia_km": number,
      "tiempo_minutos": number
    }
    ```

### 🚕 Aceptar Viaje (Conductor)
*   **Endpoint**: `POST /viaje/:id/aceptar`
*   **Body**: 
    ```json
    {
      "conductor_id": string
    }
    ```

### 🏁 Marcar Llegada del Conductor
*   **Endpoint**: `POST /viaje/:id/llegue`
*   **Body**: `{}`

### ❌ Cancelar Viaje
*   **Endpoint**: `POST /viaje/:id/cancelar`
*   **Body**: 
    ```json
    {
      "motivo": string
    }
    ```

### ⭐ Calificar Viaje
*   **Endpoint**: `POST /viaje/:id/calificar`
*   **Body**: 
    ```json
    {
      "rating": number (1-5)
    }
    ```

---

## 📈 MÓDULO DE PRECIOS (`/precio`)

### 🧮 Calcular Precio Estimado
*   **Endpoint**: `POST /precio/calcular`
*   **Body**: 
    ```json
    {
      "distancia_km": number,
      "tiempo_minutos": number,
      "tipo_vehiculo": string
    }
    ```

---

## 🆔 MÓDULO DE AUTENTICACIÓN (`/auth`)

### 🔑 Login
*   **Endpoint**: `POST /auth/login`
*   **Body**: 
    ```json
    {
      "telefono": string (o "usuario"),
      "password": string
    }
    ```

---

## 👤 MÓDULO DE CLIENTES (`/cliente`)

### 📱 Registro/Login vía WhatsApp
*   **Endpoint**: `POST /cliente/auth/whatsapp`
*   **Body**: 
    ```json
    {
      "telefono": string,
      "nombre": string
    }
    ```

---

## 🏎️ MÓDULO DE CONDUCTORES (`/conductor`)

### 📍 Actualizar Ubicación (REST)
*   **Endpoint**: `PUT /conductor/:id/ubicacion`
*   **Body**: 
    ```json
    {
      "lat": number,
      "lon": number
    }
    ```

### 🟢 Cambiar Disponibilidad
*   **Endpoint**: `PUT /conductor/:id/disponibilidad`
*   **Body**: 
    ```json
    {
      "disponible": boolean (o "true"/1)
    }
    ```

---

## 🔌 EVENTOS DE SOCKETS (Socket.io)

### 📡 Canales de Escucha (Subscribe)
*   **`conductor_{conductorId}`**: El conductor debe unirse a esta sala para recibir ofertas.
*   **`trip_{tripId}`**: El cliente debe unirse a esta sala para recibir actualizaciones de su viaje.

### 📤 Eventos Enviados por el Servidor (Emits)
*   **`oferta_viaje`**: Enviado al canal `conductor_{conductorId}`.
    ```json
    {
      "viaje_id": string,
      "monto": number,
      "distancia_ruta": number,
      "tiempo_minutos": number,
      "origen_lat": number,
      "origen_lon": number,
      "origen_texto": string,
      "destino_lat": number,
      "destino_lon": number,
      "destino_texto": string,
      "ruta": any[] (puntos GPS),
      "cliente_nombre_corto": string,
      "cliente_calificacion": number
    }
    ```
*   **`trip_updated`**: Enviado al canal `trip_{tripId}`. Entrega un objeto `ViajeResponseDto` completo.

### 📥 Eventos Recibidos por el Servidor (Listeners)
*   **`actualizar_ubicacion`**: El APK del conductor envía su GPS.
    ```json
    {
      "lat": number,
      "lon": number
    }
    ```
*   **`join_trip`**: El cliente se une al ID del viaje para seguimiento.
    ```json
    "trip_id_string"
    ```

---

## 🟢 ESTÁNDARES GLOBALES
*   **Tiempo**: Siempre en **`tiempo_minutos`**.
*   **Coordenadas**: El estándar del backend es utilizar **`lat`** y **`lon`** (o **`lng`** en algunos DTOs específicos de confirmación, ver tabla arriba).
