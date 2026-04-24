-- 08_refactor_planes.sql
-- Refactorización de la tabla de planes para soporte dinámico y creación de planes iniciales

-- 1. Actualizar estructura de la tabla planes
ALTER TABLE public.planes RENAME COLUMN precio_mensual TO precio;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS duracion_dias integer DEFAULT 30;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS costo_base_solicitud numeric(10, 2) DEFAULT 0;
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS costo_km numeric(10, 2) DEFAULT 0.10;

-- 2. Limpiar planes antiguos si existen (opcional, dependiendo de si quieres conservar datos de prueba)
-- DELETE FROM public.planes;

-- 3. Insertar los planes solicitados
-- Plan por Solicitud: El conductor paga por cada viaje aceptado
INSERT INTO public.planes (id, nombre, descripcion, precio, solicitudes_incluidas, costo_base_solicitud, costo_km, duracion_dias, activo)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-e0f1a2b3c4d5',
    'Plan por Solicitud',
    'Paga solo por lo que usas. Ideal para conductores ocasionales.',
    0.00,
    0,     -- 0 solicitudes incluidas, siempre cobra base + km
    1.00,  -- BS. 1.00 por aceptación
    0.10,  -- BS. 0.10 por KM
    NULL,  -- Sin vencimiento
    true
) ON CONFLICT (id) DO UPDATE SET precio = 0.00, costo_base_solicitud = 1.00, costo_km = 0.10;

-- Plan Diario: Ideal para un día de trabajo intenso
INSERT INTO public.planes (id, nombre, descripcion, precio, solicitudes_incluidas, costo_base_solicitud, costo_km, duracion_dias, activo)
VALUES (
    'b2c3d4e5-f6a7-5b6c-9d0e-f1a2b3c4d5e6',
    'Plan Diario (10 Solicitudes)',
    '10 viajes con KM gratis incluidos por un solo pago diario.',
    8.00,
    10,
    0.00,  -- Las 10 primeras no cobran base
    0.00,  -- BS. 0.00 KM (Incluido en el plan)
    1,
    true
) ON CONFLICT (id) DO UPDATE SET precio = 8.00, solicitudes_incluidas = 10, costo_km = 0.00, duracion_dias = 1;

-- Plan Semanal (60): Balance perfecto para la semana
INSERT INTO public.planes (id, nombre, descripcion, precio, solicitudes_incluidas, costo_base_solicitud, costo_km, duracion_dias, activo)
VALUES (
    'c3d4e5f6-a7b8-6c7d-0e1f-a2b3c4d5e6f7',
    'Plan Semanal (60 Solicitudes)',
    '60 viajes con KM gratis incluidos.',
    45.00,
    60,
    0.00,
    0.00, -- KM gratis
    7,
    true
) ON CONFLICT (id) DO UPDATE SET precio = 45.00, solicitudes_incluidas = 60, costo_km = 0.00, duracion_dias = 7;

-- Plan Semanal (140): Para los conductores más activos
INSERT INTO public.planes (id, nombre, descripcion, precio, solicitudes_incluidas, costo_base_solicitud, costo_km, duracion_dias, activo)
VALUES (
    'd4e5f6a7-b8c9-7d8e-1f2a-b3c4d5e6f7a8',
    'Plan Semanal (140 Solicitudes)',
    '140 viajes con KM gratis incluidos.',
    90.00,
    140,
    0.00,
    0.00, -- KM gratis
    7,
    true
) ON CONFLICT (id) DO UPDATE SET precio = 90.00, solicitudes_incluidas = 140, costo_km = 0.00, duracion_dias = 7;
