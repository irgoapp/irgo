-- 02_tables.sql
-- Tablas para el microservicio de mapas (Sincronizado con Producción)

-- Calles para pgRouting
CREATE TABLE public.streets (
    id bigserial NOT NULL,
    osm_id bigint NULL,
    name text NULL,
    category text NULL DEFAULT 'unclassified'::text,
    oneway boolean NULL DEFAULT false,
    maxspeed integer NULL,
    source bigint NULL,
    target bigint NULL,
    cost double precision NULL,
    reverse_cost double precision NULL,
    custom_weight double precision NULL DEFAULT 1.0,
    geom geometry NULL,
    classification_auto text NULL DEFAULT 'regular'::text,
    classification_moto text NULL DEFAULT 'regular'::text,
    custom_weight_auto double precision NULL DEFAULT 1.0,
    custom_weight_moto double precision NULL DEFAULT 1.0,
    custom_reverse_weight_auto double precision NULL DEFAULT 1.0,
    custom_reverse_weight_moto double precision NULL DEFAULT 1.0,
    direction text GENERATED ALWAYS AS (
        CASE
            WHEN (cost < (0)::double precision) THEN 'v_to_u'::text
            WHEN (reverse_cost < (0)::double precision) THEN 'u_to_v'::text
            ELSE 'both'::text
        END
    ) STORED NULL,
    CONSTRAINT streets_pkey PRIMARY KEY (id),
    CONSTRAINT streets_classification_auto_check CHECK (
        classification_auto = ANY (ARRAY['avenida_principal'::text, 'calle_principal'::text, 'normal'::text, 'regular'::text, 'mala'::text, 'intransitable'::text])
    ),
    CONSTRAINT streets_classification_moto_check CHECK (
        classification_moto = ANY (ARRAY['avenida_principal'::text, 'calle_principal'::text, 'normal'::text, 'regular'::text, 'mala'::text, 'intransitable'::text])
    )
);

CREATE INDEX IF NOT EXISTS streets_geom_idx ON public.streets USING gist (geom);
CREATE INDEX IF NOT EXISTS streets_source_idx ON public.streets (source);
CREATE INDEX IF NOT EXISTS streets_target_idx ON public.streets (target);
CREATE INDEX IF NOT EXISTS streets_category_idx ON public.streets (category);
CREATE INDEX IF NOT EXISTS streets_source_target_idx ON public.streets (source, target);
CREATE INDEX IF NOT EXISTS streets_oneway_idx ON public.streets (oneway);

-- Puntos de Interés (POIs)
CREATE TABLE pois (
    id BIGSERIAL PRIMARY KEY,
    osm_id BIGINT,
    name TEXT,
    category TEXT,
    sub_category TEXT,
    geom GEOMETRY(Point, 4326)
);

CREATE INDEX pois_geom_idx ON pois USING GIST (geom);
CREATE INDEX pois_category_idx ON pois(category);

-- Nodos de la red vial
CREATE TABLE nodes (
    id BIGINT PRIMARY KEY,
    geom GEOMETRY(Point, 4326)
);

CREATE INDEX nodes_geom_idx ON nodes USING GIST (geom);
