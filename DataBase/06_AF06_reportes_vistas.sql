-- AF-06 | No se crean tablas nuevas: solo vistas derivadas (RF-44).
BEGIN;
CREATE VIEW vw_reporte_ventas_confirmadas AS
SELECT p.id_pedido, p.id_usuario, p.fecha_confirmacion, p.modalidad_entrega,
       d.id_producto, pr.codigo AS codigo_producto, pr.nombre AS nombre_producto,
       d.cantidad, d.precio_unitario,
       (d.cantidad * d.precio_unitario)::NUMERIC(14,2) AS subtotal_linea
FROM pedido p
JOIN detalle_pedido d ON d.id_pedido=p.id_pedido
JOIN producto pr ON pr.id_producto=d.id_producto
WHERE p.estado_pago='CONFIRMADO';

CREATE VIEW vw_reporte_inventario AS
SELECT p.id_producto, p.codigo, p.nombre, p.precio, p.activo,
       c.id_categoria, c.nombre AS categoria, p.existencias
FROM producto p JOIN categoria c ON c.id_categoria=p.id_categoria;

CREATE VIEW vw_reporte_ocupacion_academica AS
SELECT c.id_curso, c.nombre AS curso, c.estado, c.cupo_maximo,
       count(i.id_inscripcion)::INTEGER AS inscritos_confirmados,
       (c.cupo_maximo - count(i.id_inscripcion))::INTEGER AS cupos_disponibles
FROM curso c LEFT JOIN inscripcion i
  ON i.id_curso=c.id_curso AND i.estado='CONFIRMADA'
GROUP BY c.id_curso, c.nombre, c.estado, c.cupo_maximo;
-- El backend debe restringir estas vistas a Administrador (RNF-02).
COMMIT;
