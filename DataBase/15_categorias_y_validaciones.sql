ALTER TABLE categoria ADD COLUMN IF NOT EXISTS descripcion VARCHAR(60);
ALTER TABLE categoria ADD COLUMN IF NOT EXISTS simbolo VARCHAR(4) NOT NULL DEFAULT '♪';

UPDATE categoria SET nombre = 'Percusión' WHERE nombre = 'Percusion';

UPDATE categoria c
SET simbolo = v.simbolo,
    descripcion = COALESCE(c.descripcion, v.descripcion)
FROM (VALUES
  ('cuerdas', '♪', 'Violines, violas y guitarras'),
  ('teclados', '♩', 'Pianos digitales y acústicos'),
  ('accesorios', '♬', 'Afinadores, arcos y atriles'),
  ('percusion', '♯', 'Cajones, tambores y panderetas'),
  ('vientos', '♫', 'Flautas, clarinetes y saxofones')
) AS v(clave, simbolo, descripcion)
WHERE translate(lower(btrim(c.nombre)), 'áéíóú', 'aeiou') = v.clave;

UPDATE usuario SET correo = lower(btrim(correo)) WHERE correo <> lower(btrim(correo));

UPDATE usuario u
SET telefono = CASE
  WHEN d.digitos ~ '^[245678][0-9]{7}$' THEN substr(d.digitos, 1, 4) || '-' || substr(d.digitos, 5, 4)
  ELSE NULL
END
FROM (
  SELECT id_usuario,
         CASE
           WHEN length(regexp_replace(telefono, '[^0-9]', '', 'g')) = 11
                AND regexp_replace(telefono, '[^0-9]', '', 'g') LIKE '506%'
             THEN right(regexp_replace(telefono, '[^0-9]', '', 'g'), 8)
           ELSE regexp_replace(telefono, '[^0-9]', '', 'g')
         END AS digitos
  FROM usuario
  WHERE telefono IS NOT NULL
) AS d
WHERE u.id_usuario = d.id_usuario;

UPDATE usuario
SET provincia = NULL
WHERE provincia IS NOT NULL
  AND provincia NOT IN ('San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón');

CREATE OR REPLACE FUNCTION pg_temp.agregar_restriccion(tabla TEXT, nombre TEXT, condicion TEXT)
RETURNS VOID AS $$
DECLARE
  incumplen BIGINT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = nombre) THEN
    RETURN;
  END IF;
  EXECUTE format('SELECT count(*) FROM %I WHERE NOT (%s)', tabla, condicion) INTO incumplen;
  IF incumplen > 0 THEN
    RAISE NOTICE 'No se agregó % en %: % filas no cumplen la regla. Corrígelas y vuelve a ejecutar el script.', nombre, tabla, incumplen;
  ELSE
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s)', tabla, nombre, condicion);
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.agregar_restriccion('categoria', 'ck_categoria_simbolo',
  $c$simbolo IN ('♪', '♩', '♫', '♬', '♯', '♭', '♮', '𝄞')$c$);
SELECT pg_temp.agregar_restriccion('categoria', 'ck_categoria_descripcion',
  $c$descripcion IS NULL OR char_length(btrim(descripcion)) BETWEEN 5 AND 60$c$);
SELECT pg_temp.agregar_restriccion('categoria', 'ck_categoria_nombre_largo',
  $c$char_length(btrim(nombre)) BETWEEN 3 AND 40$c$);

SELECT pg_temp.agregar_restriccion('usuario', 'ck_usuario_nombre_largo',
  $c$char_length(btrim(nombre)) BETWEEN 3 AND 100$c$);
SELECT pg_temp.agregar_restriccion('usuario', 'ck_usuario_correo_formato',
  $c$correo = lower(btrim(correo)) AND correo ~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$'$c$);
SELECT pg_temp.agregar_restriccion('usuario', 'ck_usuario_telefono_formato',
  $c$telefono IS NULL OR telefono ~ '^[245678][0-9]{3}-[0-9]{4}$'$c$);
SELECT pg_temp.agregar_restriccion('usuario', 'ck_usuario_provincia',
  $c$provincia IS NULL OR provincia IN ('San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón')$c$);

SELECT pg_temp.agregar_restriccion('producto', 'ck_producto_codigo_formato',
  $c$codigo ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$' AND char_length(codigo) BETWEEN 2 AND 30$c$);
SELECT pg_temp.agregar_restriccion('producto', 'ck_producto_nombre_largo',
  $c$char_length(btrim(nombre)) BETWEEN 3 AND 120$c$);
SELECT pg_temp.agregar_restriccion('producto', 'ck_producto_precio_rango',
  $c$precio <= 50000000 AND precio = round(precio, 2)$c$);
SELECT pg_temp.agregar_restriccion('producto', 'ck_producto_existencias_maximas',
  $c$existencias <= 100000$c$);
SELECT pg_temp.agregar_restriccion('producto', 'ck_producto_descripcion_larga',
  $c$descripcion IS NULL OR char_length(descripcion) <= 1000$c$);

SELECT pg_temp.agregar_restriccion('movimiento_inventario', 'ck_movimiento_cantidad_maxima',
  $c$cantidad <= 100000$c$);
SELECT pg_temp.agregar_restriccion('movimiento_inventario', 'ck_movimiento_motivo_largo',
  $c$motivo IS NULL OR char_length(motivo) <= 300$c$);

SELECT pg_temp.agregar_restriccion('linea_carrito', 'ck_linea_carrito_cantidad_maxima',
  $c$cantidad <= 99$c$);
SELECT pg_temp.agregar_restriccion('detalle_pedido', 'ck_detalle_pedido_cantidad_maxima',
  $c$cantidad <= 99$c$);
SELECT pg_temp.agregar_restriccion('pedido', 'ck_pedido_direccion_larga',
  $c$direccion_entrega IS NULL OR char_length(direccion_entrega) BETWEEN 10 AND 300$c$);

SELECT pg_temp.agregar_restriccion('curso', 'ck_curso_nombre_largo',
  $c$char_length(btrim(nombre)) BETWEEN 3 AND 120$c$);
SELECT pg_temp.agregar_restriccion('curso', 'ck_curso_descripcion_larga',
  $c$char_length(btrim(descripcion)) BETWEEN 10 AND 1000$c$);
SELECT pg_temp.agregar_restriccion('curso', 'ck_curso_cupo_maximo',
  $c$cupo_maximo <= 100$c$);

SELECT pg_temp.agregar_restriccion('horario', 'ck_horario_franja',
  $c$hora_inicio >= TIME '06:00' AND hora_fin <= TIME '22:00'$c$);
SELECT pg_temp.agregar_restriccion('horario', 'ck_horario_duracion',
  $c$hora_fin - hora_inicio BETWEEN INTERVAL '30 minutes' AND INTERVAL '4 hours'$c$);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_promocion_pendiente_curso') THEN
    IF EXISTS (
      SELECT id_curso FROM recomendacion
      WHERE tipo = 'PROMOCION_ACADEMICA' AND estado = 'PENDIENTE'
      GROUP BY id_curso HAVING count(*) > 1
    ) THEN
      RAISE NOTICE 'No se creó uq_promocion_pendiente_curso: hay cursos con más de una promoción pendiente.';
    ELSE
      CREATE UNIQUE INDEX uq_promocion_pendiente_curso ON recomendacion (id_curso)
        WHERE tipo = 'PROMOCION_ACADEMICA' AND estado = 'PENDIENTE';
    END IF;
  END IF;
END;
$$;
