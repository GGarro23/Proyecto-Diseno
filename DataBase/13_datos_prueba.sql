-- Datos de prueba para la Etapa 2 (se ejecuta después de 10, 11 y 12).
-- Crea cuentas, roles, permisos, profesores asignados, inscripciones, asistencias,
-- pedidos con pago simulado y cambios de estado. Usa las funciones de 09 para
-- respetar las mismas reglas que el backend.
--
-- TODAS las cuentas usan la contraseña de prueba: Intervallum1 (hash bcrypt, costo 10).
-- Los idUsuario coinciden con los datos de prueba del frontend.
BEGIN;

-- ---------- Usuarios (14) ----------
INSERT INTO usuario (id_usuario, nombre, correo, contrasena_hash, activo, telefono, provincia, fecha_registro) VALUES
 (1,    'Ana Mora',          'ana@intervallum.cr',     '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  '+506 8888 1840', 'San José', '2023-02-14'),
 (2,    'Carlos Rojas',      'carlos@intervallum.cr',  '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             NULL,       '2024-05-03'),
 (10,   'Mariana Solano',    'mariana@intervallum.cr', '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  '+506 8800 1010', 'San José', '2021-03-01'),
 (11,   'Andrés Quesada',    'andres@intervallum.cr',  '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  '+506 8800 1111', 'Heredia',  '2021-08-15'),
 (12,   'Lucía Vargas',      'lucia@intervallum.cr',   '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  '+506 8800 1212', 'Cartago',  '2022-01-10'),
 (20,   'Diego Campos',      'pedidos@intervallum.cr', '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'San José', '2022-06-20'),
 (30,   'Laura Jiménez',     'admin@intervallum.cr',   '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'San José', '2020-01-15'),
 (31,   'Pablo Arias',       'sistema@intervallum.cr', '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'San José', '2020-01-15'),
 (40,   'Cuenta Desactivada','inactivo@intervallum.cr','$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', FALSE, NULL,             NULL,       '2023-09-09'),
 (1000, 'Valeria Chaves',    'valeria@correo.cr',      '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'Alajuela', '2025-02-10'),
 (1001, 'Sebastián Mora',    'sebastian@correo.cr',    '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'San José', '2025-03-02'),
 (1002, 'Daniela Rojas',     'daniela@correo.cr',      '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'Heredia',  '2025-04-18'),
 (1003, 'Mateo Jiménez',     'mateo@correo.cr',        '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'Cartago',  '2025-06-07'),
 (1004, 'Camila Vargas',     'camila@correo.cr',       '$2b$10$Xx/5a5.VeZ2WNgX6qrL3b.Pju9IHG4fCyS6Sqj1DbN80Cpkz/fjci', TRUE,  NULL,             'Puntarenas','2025-07-21')
ON CONFLICT DO NOTHING;

-- Los id se dieron a mano: la secuencia sigue desde el mayor
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'), (SELECT max(id_usuario) FROM usuario));

-- ---------- Roles de cada cuenta ----------
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT v.id_usuario, r.id_rol
FROM (VALUES
 (1, 'Cliente'), (2, 'Cliente'), (40, 'Cliente'),
 (1000, 'Cliente'), (1001, 'Cliente'), (1002, 'Cliente'), (1003, 'Cliente'), (1004, 'Cliente'),
 (10, 'Profesor'), (11, 'Profesor'), (12, 'Profesor'),
 (20, 'Encargado de pedidos'),
 (30, 'Administrador'),
 (31, 'Administrador del sistema')
) AS v(id_usuario, rol)
JOIN rol r ON r.nombre = v.rol
ON CONFLICT DO NOTHING;

-- ---------- Permisos (8) y matriz inicial (RF-10, Figura 40) ----------
INSERT INTO permiso (codigo, descripcion) VALUES
 ('catalogo.administrar',  'Administrar productos, categorías e inventario'),
 ('pedidos.consultar',     'Consultar pedidos de la tienda'),
 ('pedidos.actualizar',    'Actualizar el estado de los pedidos'),
 ('academia.administrar',  'Administrar cursos, horarios y profesores'),
 ('asistencias.registrar', 'Registrar asistencias'),
 ('reportes.consultar',    'Consultar reportes'),
 ('agente.usar',           'Generar y revisar recomendaciones del agente'),
 ('etl.ejecutar',          'Ejecutar importaciones ETL')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM (VALUES
 ('Profesor', 'asistencias.registrar'),
 ('Encargado de pedidos', 'pedidos.consultar'),
 ('Encargado de pedidos', 'pedidos.actualizar'),
 ('Administrador', 'catalogo.administrar'),
 ('Administrador', 'pedidos.consultar'),
 ('Administrador', 'academia.administrar'),
 ('Administrador', 'reportes.consultar'),
 ('Administrador', 'agente.usar'),
 ('Administrador', 'etl.ejecutar')
) AS v(rol, codigo)
JOIN rol r ON r.nombre = v.rol
JOIN permiso p ON p.codigo = v.codigo
ON CONFLICT DO NOTHING;

-- ---------- Profesores asignados a los cursos de 10 (RF-34) ----------
UPDATE curso SET id_profesor = 10 WHERE nombre IN ('Piano para principiantes', 'Ensambles avanzados') AND id_profesor IS NULL;
UPDATE curso SET id_profesor = 11 WHERE nombre = 'Violin inicial' AND id_profesor IS NULL;
UPDATE curso SET id_profesor = 12 WHERE nombre = 'Teoria musical I' AND id_profesor IS NULL;

-- ---------- Inscripciones (RF-37). El trigger agrega el rol Estudiante ----------
SELECT inscribir_en_curso(v.id_usuario, c.id_curso)
FROM (VALUES
 (1, 'Piano para principiantes'),
 (1000, 'Piano para principiantes'), (1001, 'Piano para principiantes'), (1002, 'Piano para principiantes'),
 (1003, 'Violin inicial'), (1004, 'Violin inicial'), (1000, 'Violin inicial'),
 (1001, 'Teoria musical I'), (1002, 'Teoria musical I'), (2, 'Teoria musical I')
) AS v(id_usuario, nombre)
JOIN curso c ON c.nombre = v.nombre
WHERE NOT EXISTS (SELECT 1 FROM inscripcion i WHERE i.id_usuario = v.id_usuario AND i.id_curso = c.id_curso);

-- ---------- Asistencias de Ana en Piano para principiantes (RF-40): 6 sesiones ----------
INSERT INTO asistencia (id_inscripcion, fecha, estado_asistencia)
SELECT i.id_inscripcion, v.fecha::DATE, v.estado
FROM (VALUES
 ('2026-10-05', 'PRESENTE'), ('2026-10-07', 'PRESENTE'), ('2026-10-12', 'AUSENTE'),
 ('2026-10-14', 'PRESENTE'), ('2026-10-19', 'PRESENTE'), ('2026-10-21', 'PRESENTE')
) AS v(fecha, estado)
JOIN curso c ON c.nombre = 'Piano para principiantes'
JOIN inscripcion i ON i.id_usuario = 1 AND i.id_curso = c.id_curso
ON CONFLICT DO NOTHING;

-- ---------- Pedidos (RF-23 a RF-28) ----------
-- Cada pedido se arma con el carrito, se crea con crear_pedido_desde_carrito y se paga con
-- simular_pago_pedido, que descuenta inventario. Después se vacía el carrito.
CREATE TEMP TABLE compra_prueba (orden INT, id_usuario BIGINT, codigo TEXT, cantidad INT, modalidad TEXT, direccion TEXT, pago TEXT, avances TEXT[]);
INSERT INTO compra_prueba VALUES
 (1, 1,    'ARCO-EBANO',   1, 'ENVIO',  'San José, Montes de Oca. 100 m norte del parque', 'PAGO_OK', ARRAY[]::TEXT[]),
 (2, 2,    'PIANO-AUREUM', 1, 'RETIRO', NULL, 'PAGO_OK', ARRAY['EN_PREPARACION']),
 (3, 1000, 'FLAU-DUL-01',  2, 'ENVIO',  'Alajuela centro, 200 m sur de la catedral', 'PAGO_OK', ARRAY['EN_PREPARACION', 'EMPACADO']),
 (4, 1001, 'GUIT-CLAS-01', 1, 'RETIRO', NULL, 'PAGO_OK', ARRAY['EN_PREPARACION', 'LISTO_RETIRO']),
 (5, 1002, 'AFIN-CROM-01', 1, 'ENVIO',  'Heredia, San Pablo. Casa 12', 'PAGO_OK', ARRAY['EN_PREPARACION', 'EMPACADO', 'ENVIADO']),
 (6, 1003, 'CAJ-PER-01',   1, 'RETIRO', NULL, 'PAGO_RECHAZADO', ARRAY[]::TEXT[]);

DO $$
DECLARE
  c compra_prueba%ROWTYPE;
  v_carrito BIGINT;
  v_pedido BIGINT;
  v_estado TEXT;
BEGIN
  FOR c IN SELECT * FROM compra_prueba ORDER BY orden LOOP
    -- Si ya existe un pedido de prueba de este usuario, no se repite
    CONTINUE WHEN EXISTS (SELECT 1 FROM pedido WHERE id_usuario = c.id_usuario);
    INSERT INTO carrito (id_usuario) VALUES (c.id_usuario) ON CONFLICT DO NOTHING;
    SELECT id_carrito INTO v_carrito FROM carrito WHERE id_usuario = c.id_usuario;
    DELETE FROM linea_carrito WHERE id_carrito = v_carrito;
    INSERT INTO linea_carrito (id_carrito, id_producto, cantidad)
    SELECT v_carrito, id_producto, c.cantidad FROM producto WHERE codigo = c.codigo;
    v_pedido := crear_pedido_desde_carrito(c.id_usuario, c.modalidad, c.direccion);
    PERFORM * FROM simular_pago_pedido(c.id_usuario, v_pedido, c.pago);
    DELETE FROM linea_carrito WHERE id_carrito = v_carrito;
    FOREACH v_estado IN ARRAY c.avances LOOP
      PERFORM avanzar_estado_pedido(v_pedido, 20, v_estado);
    END LOOP;
  END LOOP;
END $$;

DROP TABLE compra_prueba;

-- ---------- Recomendación revisada, para ver los dos estados (RF-47, RF-48) ----------
UPDATE recomendacion SET estado = 'REVISADA', fecha_revision = NOW(), id_revisor = 30
WHERE tipo = 'PROMOCION_ACADEMICA' AND estado = 'PENDIENTE';

COMMIT;

-- Conteo rápido de filas de prueba
SELECT 'usuario' AS tabla, count(*) FROM usuario
UNION ALL SELECT 'usuario_rol', count(*) FROM usuario_rol
UNION ALL SELECT 'permiso', count(*) FROM permiso
UNION ALL SELECT 'rol_permiso', count(*) FROM rol_permiso
UNION ALL SELECT 'categoria', count(*) FROM categoria
UNION ALL SELECT 'producto', count(*) FROM producto
UNION ALL SELECT 'curso', count(*) FROM curso
UNION ALL SELECT 'horario', count(*) FROM horario
UNION ALL SELECT 'inscripcion', count(*) FROM inscripcion
UNION ALL SELECT 'asistencia', count(*) FROM asistencia
UNION ALL SELECT 'pedido', count(*) FROM pedido
UNION ALL SELECT 'detalle_pedido', count(*) FROM detalle_pedido
UNION ALL SELECT 'intento_pago_simulado', count(*) FROM intento_pago_simulado
UNION ALL SELECT 'historial_estado_pedido', count(*) FROM historial_estado_pedido
UNION ALL SELECT 'movimiento_inventario', count(*) FROM movimiento_inventario
UNION ALL SELECT 'recomendacion', count(*) FROM recomendacion;