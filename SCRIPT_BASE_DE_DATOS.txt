-- =========================================================================
-- BASE DE DATOS: TEO VESTIDOR INTERACTIVO
-- Motor: PostgreSQL / Supabase
-- Autor: Nicolás Pensel (TEO - Grupo 102)
-- Fecha: Octubre 2026
-- =========================================================================

-- Desactivar temporalmente avisos si se ejecutan recreaciones
SET client_min_messages TO warning;

-- =========================================================================
-- 1. TABLAS MAESTRAS / CATÁLOGOS (Normalización de datos de referencia)
-- =========================================================================

-- 1.1 Tabla de Géneros
CREATE TABLE IF NOT EXISTS generos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,      -- 'nino', 'nina', 'otro', 'no_dice'
    nombre VARCHAR(50) NOT NULL,             -- 'Niño', 'Niña', 'Otro', 'Prefiero no decirlo'
    descripcion TEXT,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Tabla de Perfiles de Desarrollo (Sensorial / Neurodivergente)
CREATE TABLE IF NOT EXISTS perfiles_desarrollo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,      -- 'neurotipico', 'tea', 'tdah', 'lenguaje', 'otro', 'no_dice'
    nombre VARCHAR(100) NOT NULL,            -- 'TEA (Trastorno del espectro autista)', etc.
    descripcion TEXT,
    es_neurodivergente BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Tabla de Modelos / Skins Base de TEO
CREATE TABLE IF NOT EXISTS skins_teo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,      -- 'osito', 'chanchito', 'chimuelo', etc.
    nombre VARCHAR(100) NOT NULL,            -- 'Osito', 'Chanchito', 'Chimuelo', etc.
    archivo_imagen_real VARCHAR(255) NOT NULL,-- 'Osito.png', 'Chanchito.png'
    color_principal VARCHAR(20),             -- Hex para armonía visual
    color_secundario VARCHAR(20),
    frase_presentacion TEXT,                 -- Frase característica de voz que dice TEO
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 Tabla de Tipos / Categorías de Accesorios y Prendas
CREATE TABLE IF NOT EXISTS tipos_accesorios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,      -- 'cabeza', 'torso', 'piernas'
    nombre VARCHAR(50) NOT NULL,             -- 'Cabeza / Sombreros', 'Remeras / Torso', 'Pantalones / Piernas'
    descripcion TEXT,
    capa_zindex INT NOT NULL DEFAULT 10,     -- Altura visual en el render (ej: piernas=10, torso=20, cabeza=30)
    posicion_porcentaje NUMERIC(5,2),        -- Altura CSS relativa (ej: cabeza=20.00%, torso=58.00%, piernas=86.00%)
    icono VARCHAR(20) DEFAULT '✨',
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Tabla de Catálogo de Accesorios y Prendas
CREATE TABLE IF NOT EXISTS accesorios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,      -- 'head-1', 'top-4', 'bottom-1', etc.
    tipo_accesorio_id INT NOT NULL REFERENCES tipos_accesorios(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,            -- 'Cola de dinosaurio', 'Camiseta de fútbol', etc.
    icono VARCHAR(20),                       -- Emoji / ícono representativo
    frase_voz_teo TEXT,                      -- Frase con la que TEO agradece ponerse la prenda
    archivo_svg TEXT,                        -- Representación vectorial SVG o URL al recurso
    color_predeterminado VARCHAR(20),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 2. TABLAS TRANSACCIONALES (Sesiones y Partidas del Niño)
-- =========================================================================

-- 2.1 Tabla de Sesiones Guardadas (Cabecera de Partida)
CREATE TABLE IF NOT EXISTS sesiones_guardadas (
    id VARCHAR(64) PRIMARY KEY,              -- ID único (ej: "ses_1728562341_abc" o UUID)
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Datos del Niño/Jugador
    nombre VARCHAR(100) NOT NULL,
    edad NUMERIC(4,1) NOT NULL CHECK (edad >= 0 AND edad <= 120),
    genero_id INT REFERENCES generos(id) ON DELETE SET NULL,
    perfil_desarrollo_id INT REFERENCES perfiles_desarrollo(id) ON DELETE SET NULL,
    
    -- Configuración Base del Muñeco TEO
    skin_id INT REFERENCES skins_teo(id) ON DELETE SET NULL,
    estilo_visual VARCHAR(20) NOT NULL DEFAULT 'real' CHECK (estilo_visual IN ('real', 'dibujo')),
    
    -- Datos de Geolocalización y Conexión (Módulo idéntico a "Qué canción suena")
    ubicacion VARCHAR(150) DEFAULT '',       -- Ej: '🇦🇷 Buenos Aires'
    barrio VARCHAR(100) DEFAULT '',          -- Ej: 'Ramos Mejía' o 'Villa Sarmiento'
    codigo_postal VARCHAR(20) DEFAULT '',    -- Ej: '1704'
    proveedor VARCHAR(100) DEFAULT '',       -- Ej: 'Telecentro' o 'Movistar'
    ip VARCHAR(45) DEFAULT '',               -- IP de conexión (IPv4 / IPv6)
    
    -- Métricas de Usabilidad y Preferencias Sensoriales
    duracion_segundos INT DEFAULT 0,         -- Tiempo total interactuando antes de guardar
    cantidad_cambios_ropa INT DEFAULT 0,     -- Cantidad de veces que probó prendas en la partida
    sonido_activado BOOLEAN DEFAULT TRUE,    -- Si jugó con efectos de sonido habilitados
    voz_teo_activada BOOLEAN DEFAULT TRUE,   -- Si jugó con la voz de TEO hablando
    foto_descargada BOOLEAN DEFAULT FALSE,   -- Si descargó la postal de recuerdo al finalizar
    dispositivo VARCHAR(150) DEFAULT '',     -- User-Agent / 'Mobile', 'Tablet', 'Desktop'
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Tabla de Prendas Seleccionadas por Sesión (Detalle 1:N)
-- Cada sesión guarda qué prenda quedó puesta para cada tipo de accesorio
CREATE TABLE IF NOT EXISTS sesion_prendas_seleccionadas (
    id BIGSERIAL PRIMARY KEY,
    sesion_id VARCHAR(64) NOT NULL REFERENCES sesiones_guardadas(id) ON DELETE CASCADE,
    tipo_accesorio_id INT NOT NULL REFERENCES tipos_accesorios(id) ON DELETE RESTRICT,
    accesorio_id INT REFERENCES accesorios(id) ON DELETE SET NULL, 
    -- NOTA: Si accesorio_id es NULL, indica que el niño eligió dejar a TEO "al natural" sin prenda en esa zona
    fecha_seleccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricción de unicidad: Una sesión solo tiene una prenda seleccionada por cada tipo
    CONSTRAINT uq_sesion_tipo_accesorio UNIQUE (sesion_id, tipo_accesorio_id)
);

-- 2.3 Tabla de Telemetría e Interacciones Sensoriales (Opcional pero clave para Tesis/TEA)
-- Registra micro-interacciones: toques para pedir abrazos, tiradas de dados al azar, silenciado de voz
CREATE TABLE IF NOT EXISTS sesion_eventos_telemetria (
    id BIGSERIAL PRIMARY KEY,
    sesion_id VARCHAR(64) NOT NULL REFERENCES sesiones_guardadas(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    tipo_evento VARCHAR(50) NOT NULL,        -- 'tap_teo_abrazo', 'dado_azar', 'quitar_prenda', 'silenciar_voz'
    detalle JSONB DEFAULT '{}'::jsonb        -- Metadatos adicionales en formato flexible
);

-- =========================================================================
-- 3. ÍNDICES DE RENDIMIENTO (Optimización para Consultas y Dashboards)
-- =========================================================================

-- Índices en Sesiones Guardadas
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones_guardadas(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_nombre ON sesiones_guardadas(nombre);
CREATE INDEX IF NOT EXISTS idx_sesiones_perfil ON sesiones_guardadas(perfil_desarrollo_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_genero ON sesiones_guardadas(genero_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_skin ON sesiones_guardadas(skin_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_ubicacion ON sesiones_guardadas(ubicacion);

-- Índices en Prendas Seleccionadas
CREATE INDEX IF NOT EXISTS idx_sesion_prendas_sesion ON sesion_prendas_seleccionadas(sesion_id);
CREATE INDEX IF NOT EXISTS idx_sesion_prendas_accesorio ON sesion_prendas_seleccionadas(accesorio_id);
CREATE INDEX IF NOT EXISTS idx_sesion_prendas_tipo ON sesion_prendas_seleccionadas(tipo_accesorio_id);

-- Índices en Catálogos
CREATE INDEX IF NOT EXISTS idx_accesorios_tipo ON accesorios(tipo_accesorio_id);
CREATE INDEX IF NOT EXISTS idx_accesorios_activo ON accesorios(activo);

-- Índices en Telemetría
CREATE INDEX IF NOT EXISTS idx_telemetria_sesion ON sesion_eventos_telemetria(sesion_id);
CREATE INDEX IF NOT EXISTS idx_telemetria_evento ON sesion_eventos_telemetria(tipo_evento);

-- =========================================================================
-- 4. SEGURIDAD: DESACTIVACIÓN DE RLS (O Políticas para Supabase)
-- =========================================================================

ALTER TABLE generos DISABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_desarrollo DISABLE ROW LEVEL SECURITY;
ALTER TABLE skins_teo DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_accesorios DISABLE ROW LEVEL SECURITY;
ALTER TABLE accesorios DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_guardadas DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_prendas_seleccionadas DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesion_eventos_telemetria DISABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 5. VISTAS ANALÍTICAS (Consultas Resueltas para el Administrador)
-- =========================================================================

-- 5.1 Vista Completa de Sesiones (Desnormalizada con todos los JOINs)
CREATE OR REPLACE VIEW v_sesiones_completas AS
SELECT 
    s.id AS sesion_id,
    s.fecha_creacion,
    s.nombre AS nino_nombre,
    s.edad AS nino_edad,
    COALESCE(g.nombre, 'Sin especificar') AS genero,
    COALESCE(p.nombre, 'Sin especificar') AS perfil_desarrollo,
    COALESCE(sk.nombre, 'Osito') AS skin_teo,
    CASE 
        WHEN s.estilo_visual = 'real' THEN '📷 TEO Real (Foto)'
        ELSE '🎨 TEO Dibujo (Ilustración)'
    END AS estilo_visual,
    -- Accesorios seleccionados por tipo
    MAX(CASE WHEN ta.codigo = 'cabeza' THEN acc.nombre ELSE NULL END) AS prenda_cabeza,
    MAX(CASE WHEN ta.codigo = 'torso' THEN acc.nombre ELSE NULL END) AS prenda_remera,
    MAX(CASE WHEN ta.codigo = 'piernas' THEN acc.nombre ELSE NULL END) AS prenda_pantalon,
    -- Ubicación y red
    s.ubicacion,
    s.barrio,
    s.codigo_postal,
    s.proveedor,
    -- Métricas
    s.duracion_segundos,
    s.cantidad_cambios_ropa,
    s.sonido_activado,
    s.voz_teo_activada,
    s.foto_descargada,
    s.dispositivo
FROM sesiones_guardadas s
LEFT JOIN generos g ON s.genero_id = g.id
LEFT JOIN perfiles_desarrollo p ON s.perfil_desarrollo_id = p.id
LEFT JOIN skins_teo sk ON s.skin_id = sk.id
LEFT JOIN sesion_prendas_seleccionadas sp ON s.id = sp.sesion_id
LEFT JOIN tipos_accesorios ta ON sp.tipo_accesorio_id = ta.id
LEFT JOIN accesorios acc ON sp.accesorio_id = acc.id
GROUP BY 
    s.id, s.fecha_creacion, s.nombre, s.edad, g.nombre, p.nombre, 
    sk.nombre, s.estilo_visual, s.ubicacion, s.barrio, s.codigo_postal, 
    s.proveedor, s.duracion_segundos, s.cantidad_cambios_ropa, 
    s.sonido_activado, s.voz_teo_activada, s.foto_descargada, s.dispositivo
ORDER BY s.fecha_creacion DESC;

-- 5.2 Vista de Métricas Agrupadas por Perfil de Desarrollo (Clave para Tesis)
CREATE OR REPLACE VIEW v_metricas_por_perfil AS
SELECT 
    COALESCE(p.nombre, 'Sin especificar') AS perfil_desarrollo,
    COUNT(s.id) AS total_sesiones,
    ROUND(AVG(s.edad), 1) AS edad_promedio,
    ROUND(AVG(s.duracion_segundos), 0) AS duracion_promedio_seg,
    ROUND(AVG(s.cantidad_cambios_ropa), 1) AS promedio_cambios_ropa,
    COUNT(CASE WHEN s.voz_teo_activada THEN 1 END) AS sesiones_con_voz_activa,
    COUNT(CASE WHEN s.foto_descargada THEN 1 END) AS fotos_descargadas
FROM sesiones_guardadas s
LEFT JOIN perfiles_desarrollo p ON s.perfil_desarrollo_id = p.id
GROUP BY p.nombre
ORDER BY total_sesiones DESC;

-- 5.3 Vista de Ranking de Prendas Más Elegidas
CREATE OR REPLACE VIEW v_ranking_prendas_populares AS
SELECT 
    ta.nombre AS categoria,
    acc.nombre AS prenda,
    acc.icono,
    COUNT(sp.id) AS veces_elegida
FROM sesion_prendas_seleccionadas sp
JOIN accesorios acc ON sp.accesorio_id = acc.id
JOIN tipos_accesorios ta ON sp.tipo_accesorio_id = ta.id
GROUP BY ta.nombre, acc.nombre, acc.icono
ORDER BY ta.nombre, veces_elegida DESC;

-- =========================================================================
-- 6. DATOS SEMILLA (SEEDS / CARGA INICIAL DE CATÁLOGOS)
-- =========================================================================

-- 6.1 Carga de Géneros
INSERT INTO generos (codigo, nombre, descripcion, orden) VALUES
('nino', 'Niño', 'Identificación masculina', 1),
('nina', 'Niña', 'Identificación femenina', 2),
('otro', 'Otro', 'Otra identidad', 3),
('no_dice', 'Prefiero no decirlo', 'Sin especificación', 4)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 6.2 Carga de Perfiles de Desarrollo
INSERT INTO perfiles_desarrollo (codigo, nombre, descripcion, es_neurodivergente, orden) VALUES
('neurotipico', 'Neurotípico / sin diagnóstico', 'Desarrollo neurológico estándar', FALSE, 1),
('tea', 'TEA (Trastorno del espectro autista)', 'Condición del espectro autista', TRUE, 2),
('tdah', 'TDAH', 'Trastorno por déficit de atención e hiperactividad', TRUE, 3),
('lenguaje', 'Trastorno del Lenguaje o Comunicación', 'Dificultades en habla o comunicación expresiva/receptiva', TRUE, 4),
('otro', 'Otro', 'Otro perfil o condición de neurodesarrollo', TRUE, 5),
('no_dice', 'Prefiero no decirlo', 'Información reservada por la familia', FALSE, 6)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 6.3 Carga de Tipos de Accesorios / Prendas
INSERT INTO tipos_accesorios (codigo, nombre, descripcion, capa_zindex, posicion_porcentaje, icono, orden) VALUES
('cabeza', 'Cabeza y Accesorios', 'Gorros, vinchas, capuchas y anteojos', 30, 20.00, '🧢', 1),
('torso', 'Remeras y Abrigos', 'Remeras, buzos, chalecos y camisetas', 20, 58.00, '👕', 2),
('piernas', 'Pantalones y Colas', 'Pantalones, shorts, jardineros y colitas', 10, 86.00, '👖', 3)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 6.4 Carga de las 9 Skins Oficiales de TEO
INSERT INTO skins_teo (codigo, nombre, archivo_imagen_real, color_principal, color_secundario, frase_presentacion, orden) VALUES
('osito', 'Osito', 'Osito.png', '#C88E4B', '#DEAA66', '¡Soy TEO en versión Osito clásico!', 1),
('chanchito', 'Chanchito', 'Chanchito.png', '#F497A9', '#FBC4CE', '¡Oink oink! ¡Soy TEO Chanchito rosa!', 2),
('chimuelo', 'Chimuelo', 'Chimuelo.png', '#1A1D20', '#33383F', '¡Soy TEO dragón Chimuelo de la noche!', 3),
('dino', 'Dino', 'Dino.png', '#16A34A', '#4ADE80', '¡Grrr! ¡Soy TEO Dino con escamitas verdes!', 4),
('oveja', 'Oveja', 'Oveja.png', '#E5DCD0', '#F5EFEB', '¡Beee! ¡Soy TEO Ovejita suave y lanuda!', 5),
('perrito', 'Perrito', 'Perrito.png', '#D9822B', '#F6B76E', '¡Guau guau! ¡Soy TEO Perrito con orejitas caídas!', 6),
('spiderman', 'Spiderman', 'Spiderman.png', '#DC2626', '#EF4444', '¡Tu amigable vecino TEO Spiderman!', 7),
('stitch', 'Stitch', 'Stitch.png', '#3B82F6', '#60A5FA', '¡Hola amigo! ¡Soy TEO Stitch alienígena!', 8),
('tiburon', 'Tiburón', 'Tiburón.png', '#64748B', '#94A3B8', '¡Aleta arriba! ¡Soy TEO Tiburón de los mares!', 9)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 6.5 Carga de los 30 Accesorios Oficiales de TEO (10 Cabeza, 10 Torso, 10 Piernas)
INSERT INTO accesorios (codigo, tipo_accesorio_id, nombre, icono, frase_voz_teo, orden) VALUES
-- CABEZA (tipo_accesorio_id = 1)
('head-1', 1, 'Capucha de dinosaurio', '🦖', '¡Grrr! ¡Soy el dinosaurio más tierno y abrazable!', 1),
('head-2', 1, 'Gorra', '🧢', '¡Qué facha! Me queda re canchera esta gorrita.', 2),
('head-3', 1, 'Piluso', '👒', '¡Me encanta este piluso de osito para salir a pasear!', 3),
('head-4', 1, 'Gorro de aviador', '🛩️', '¡Listos para despegar a una aventura en el cielo!', 4),
('head-5', 1, 'Gorro de invierno', '❄️', '¡Qué abrigadito y calentito para el frío!', 5),
('head-6', 1, 'Auriculares sensoriales', '🎧', '¡Me encanta! Me ayuda a escuchar música suave y estar tranquilo.', 6),
('head-7', 1, 'Vincha orejitas de vaca', '🐮', '¡Muuu! ¡Soy una vaquita feliz!', 7),
('head-8', 1, 'Corona mágica', '👑', '¡Su majestad TEO el primero!', 8),
('head-9', 1, 'Casco espacial', '🚀', '¡Explorando las estrellas y el espacio!', 9),
('head-10', 1, 'Gorro de chef', '👨‍🍳', '¡Hoy cocinamos galletitas de miel!', 10),

-- TORSO (tipo_accesorio_id = 2)
('top-1', 2, 'Hoodie', '🧸', '¡Super calentito y suave este buzo canguro!', 1),
('top-2', 2, 'Remera rayada', '⛵', '¡Rumbo al mar azul con mi remera marinera!', 2),
('top-3', 2, 'Remera espacial', '🪐', '¡3, 2, 1... Despegamos a Saturno!', 3),
('top-4', 2, 'Camiseta de fútbol', '⚽', '¡Salimos a la cancha con la número 10!', 4),
('top-5', 2, 'Remera de superhéroe', '⚡', '¡Super TEO al rescate con superabrazos!', 5),
('top-6', 2, 'Remera escamas de dino', '🦖', '¡Combinación de dinosaurio total!', 6),
('top-7', 2, 'Remera manchas de vaca', '🐄', '¡Miren mis manchitas de vaquita!', 7),
('top-8', 2, 'Remera arcoíris TEA', '🌈', '¡La diversidad nos hace únicos y brillantes!', 8),
('top-9', 2, 'Chaleco de explorador', '🧭', '¡Tengo bolsillos para guardar lupas y piedritas!', 9),
('top-10', 2, 'Remera pijama serena', '🌙', '¡Hora de soñar lindo con las estrellas y la luna!', 10),

-- PIERNAS (tipo_accesorio_id = 3)
('bottom-1', 3, 'Cola de dinosaurio', '🦕', '¡Tengo una colita verde con escamas suaves!', 1),
('bottom-2', 3, 'Short de jean', '👖', '¡Short de denim con huellita de cachorro!', 2),
('bottom-3', 3, 'Pantalón de jogging', '☁️', '¡Qué tela tan suavecita! Cero picazón.', 3),
('bottom-4', 3, 'Traje espacial', '🧑‍🚀', '¡Pantalón oficial de la NASA con rodilleras!', 4),
('bottom-5', 3, 'Cola de vaca', '🐄', '¡Tengo manchitas y una colita con pompón!', 5),
('bottom-6', 3, 'Pantalón pijama estrellas', '⭐', '¡Hora de soñar lindo con las estrellas!', 6),
('bottom-7', 3, 'Short deportivo de fútbol', '⚽', '¡Combinación de cancha para jugar!', 7),
('bottom-8', 3, 'Bermuda safari cargo', '🧭', '¡Con bolsillos gigantes para mis tesoros!', 8),
('bottom-9', 3, 'Jardinero de jean', '👖', '¡El overol clásico! Cómodo para jugar en el suelo.', 9),
('bottom-10', 3, 'Pantalón de lluvia', '🌧️', '¡A saltar en los charcos sin mojarse!', 10)
ON CONFLICT (codigo) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    frase_voz_teo = EXCLUDED.frase_voz_teo;

-- =========================================================================
-- FIN DEL SCRIPT
-- =========================================================================
