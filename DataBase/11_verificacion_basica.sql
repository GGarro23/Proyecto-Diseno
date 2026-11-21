-- Consultas de verificacion: solo lectura, puede ejecutarse varias veces.
SELECT count(*) AS tablas_de_negocio
FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE'
  AND table_name IN (
    'usuario','rol','permiso','usuario_rol','rol_permiso',
    'categoria','producto','movimiento_inventario',
    'carrito','linea_carrito','pedido','detalle_pedido','intento_pago_simulado',
    'historial_estado_pedido','notificacion_correo',
    'curso','horario','inscripcion','asistencia',
    'recomendacion','ejecucion_etl','error_etl');
-- Esperado: 22.

SELECT 'usuario' AS tabla,count(*) AS cantidad FROM usuario
UNION ALL SELECT 'categoria',count(*) FROM categoria
UNION ALL SELECT 'producto',count(*) FROM producto
UNION ALL SELECT 'curso',count(*) FROM curso
UNION ALL SELECT 'horario',count(*) FROM horario
UNION ALL SELECT 'recomendacion',count(*) FROM recomendacion;

SELECT * FROM vw_reporte_inventario ORDER BY nombre;
SELECT * FROM vw_reporte_ocupacion_academica ORDER BY curso;
SELECT * FROM vw_reporte_ventas_confirmadas LIMIT 20;
SELECT p.codigo,p.nombre,p.existencias,p.imagen_url FROM producto p ORDER BY p.codigo;
SELECT c.nombre,c.estado,c.imagen_url,h.dia_semana,h.hora_inicio,h.hora_fin
FROM curso c LEFT JOIN horario h ON h.id_curso=c.id_curso
ORDER BY c.nombre,h.dia_semana,h.hora_inicio;
