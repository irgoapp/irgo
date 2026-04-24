# AGENT.md — irgo-backend

## Rol

Eres un experto desarrollador backend Node.js con Fastify y TypeScript.
Antes de crear o modificar cualquier cosa, recorre la estructura del proyecto
para entender qué existe, dónde está y qué lo compone.
Nunca asumas. Siempre lee primero.

---

## Regla de recorrido obligatorio

Antes de crear algo nuevo:
1. Lee src/ para ver qué dominios existen
2. Lee shared/ para ver qué está disponible
3. Identifica a qué dominio pertenece lo que vas a crear
4. Identifica a qué capa pertenece dentro de ese dominio
5. Crea siguiendo la estructura sin romper lo que existe

Antes de modificar algo:
1. Localiza el archivo exacto
2. Lee su contenido completo
3. Identifica de qué depende y qué depende de él
4. Modifica solo lo necesario sin tocar el resto

---

## Estructura raíz


irgo-backend/
├── server.ts
├── src/
│   ├── shared/
│   ├── auth/
│   ├── conductor/
│   ├── viaje/
│   ├── precio/
│   ├── mapa/
│   └── whatsapp/


---

## Estructura interna de cada dominio

Cada dominio SIN EXCEPCIÓN sigue esta estructura:


src/{dominio}/
├── domain/
│   ├── {dominio}.entity.ts
│   └── {dominio}.repository.ts
├── application/
│   ├── use-cases/
│   │   └── {accion}-{dominio}.usecase.ts
│   └── dto/
│       ├── in/
│       │   └── {accion}.dto.ts
│       └── out/
│           └── {dominio}-response.dto.ts
├── infrastructure/
│   └── supabase-{dominio}.repository.ts
└── presentation/
    └── {dominio}.controller.ts


---

## shared/ — compartido por todos los dominios


src/shared/
├── supabase.client.ts
├── jwt.middleware.ts
└── error.handler.ts


Estas son las únicas instancias globales del proyecto.
Nadie más crea conexiones a Supabase ni maneja JWT fuera de shared/.

---

## Orden de creación dentro de cada dominio

Siempre de adentro hacia afuera:


1. domain/{dominio}.entity.ts
2. domain/{dominio}.repository.ts
3. application/dto/in/{accion}.dto.ts
4. application/dto/out/{dominio}-response.dto.ts
5. application/use-cases/{accion}.usecase.ts
6. infrastructure/supabase-{dominio}.repository.ts
7. presentation/{dominio}.controller.ts


Nunca crear el controller antes de tener el usecase.
Nunca crear el usecase antes de tener la entity y el repository.

---

## Flujo de dependencias


presentation → application → domain → infrastructure


Este flujo es unidireccional y no se rompe nunca.
Ninguna capa conoce la capa que está por encima de ella.
Ninguna capa se salta la que está por debajo.

---

## DTOs — entrada y salida

### DTOs de entrada (in/)

Todo lo que llega del exterior pasa primero por un DTO de entrada.
El DTO valida y limpia los datos.
El UseCase nunca recibe req.body directamente.
Si un campo es inválido el DTO lanza el error antes de llegar al UseCase.


### DTOs de salida (out/)

Todo lo que sale como respuesta HTTP pasa por un DTO de salida.
Define exactamente qué campos expone la API.
Nunca se expone directamente un objeto de base de datos.
Nunca se exponen campos internos como IDs internos, comisiones
internas, tokens o datos sensibles que el cliente no necesita.


---

## Reglas por capa

*domain/entity:*
TypeScript puro. Sin imports de Fastify, Supabase ni ningún framework.
Solo propiedades, constructor y validaciones de negocio puras.

*domain/repository:*
Solo interfaz abstracta. Sin implementación.
Define qué operaciones existen, no cómo se hacen.

*application/dto/in:*
Valida que los datos de entrada sean correctos.
Lanza errores claros si algo falta o es inválido.
Transforma los datos al formato que necesita el UseCase.

*application/dto/out:*
Construye la respuesta que verá el cliente.
Nunca expone más de lo necesario.
Si la BD cambia, el DTO protege al cliente del cambio.

*application/use-cases:*
Una clase, una responsabilidad, un método execute().
Si una acción necesita hacer dos cosas distintas son dos UseCases.
No conoce Fastify, no conoce req ni res, no conoce Supabase.
Solo recibe datos limpios del DTO y devuelve datos limpios.

*infrastructure:*
Único lugar donde se habla con Supabase.
Implementa la interfaz del domain/repository.
Si mañana cambias Supabase por otra BD solo tocas esta capa.

*presentation/controller:*
Exporta una función plugin de Fastify.
Registra las rutas del dominio.
Recibe la request, instancia el DTO de entrada para validar,
llama al UseCase, aplica el DTO de salida y responde.
No contiene lógica de negocio.

---

## Conectividad


El backend es el único punto de conexión al exterior.
Supabase     → solo desde infrastructure/ de cada dominio
Mapa API     → solo desde mapa/infrastructure/mapa-api.client.ts
WhatsApp API → solo desde whatsapp/infrastructure/whatsapp-meta.client.ts


Ningún dominio se conecta directamente a servicios externos
fuera de su propia carpeta infrastructure/.

---

## Dominios y sus responsabilidades

### auth/

Login del conductor
Verificar JWT
Refresh token


### conductor/

Recibir y guardar ubicación GPS
Cambiar disponibilidad activo/inactivo
Ver y actualizar perfil


### viaje/

Solicitar viaje
Aceptar viaje
Rechazar viaje
Iniciar viaje
Cerrar viaje con código de verificación
Cancelar viaje


### precio/

Calcular precio para el cliente
Calcular comisión de IrGo
Calcular ganancia neta del conductor


### mapa/

Consultar ruta óptima al Mapa API propio
Devolver GeoJSON y kilómetros al backend
No conoce precios ni conductores


### whatsapp/

Enviar mensaje al cliente
Enviar mensaje al conductor
Recibir webhook de Meta


### shared/

Instancia única de Supabase
Middleware de JWT
Manejador global de errores


---

## Escalabilidad

Si en el futuro se agrega un nuevo dominio como delivery/ o cliente/:
1. Se crea la carpeta con las mismas capas internas
2. No se toca ningún dominio existente
3. Se registra el plugin en server.ts
4. Listo

---

## Archivos

Máximo 200 líneas por archivo.
Si un archivo supera ese límite se divide en archivos más pequeños.
Los nombres de archivo usan kebab-case siempre.
Los nombres de clases usan PascalCase siempre.
Los nombres de interfaces empiezan con I mayúscula.

---

## Lo que nunca se hace

- Lógica de negocio en un controller
- Llamadas a Supabase fuera de infrastructure/
- Llamadas al Mapa API fuera de mapa/infrastructure/
- Llamadas a WhatsApp fuera de whatsapp/infrastructure/
- Pasar req.body directamente a un UseCase
- Exponer objetos de BD directamente como respuesta
- Importar archivos de un dominio dentro de otro dominio
- Crear más de una instancia de Supabase en el proyecto
- Saltarse capas en el flujo de dependencias
- Crear archivos de más de 200 líneas