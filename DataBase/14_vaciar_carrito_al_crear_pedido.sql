
BEGIN;

CREATE OR REPLACE FUNCTION crear_pedido_desde_carrito(
    p_usuario BIGINT,
    p_modalidad VARCHAR,
    p_direccion TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_carrito BIGINT;
    v_total NUMERIC(14,2);
    v_pedido BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = p_usuario
          AND activo
    ) THEN
        RAISE EXCEPTION 'Usuario inexistente o inactivo';
    END IF;

    SELECT id_carrito
    INTO v_carrito
    FROM carrito
    WHERE id_usuario = p_usuario
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario sin carrito';
    END IF;

    PERFORM 1
    FROM linea_carrito
    WHERE id_carrito = v_carrito
    FOR UPDATE;

    IF NOT EXISTS (
        SELECT 1
        FROM linea_carrito
        WHERE id_carrito = v_carrito
    ) THEN
        RAISE EXCEPTION 'No se puede comprar con carrito vacio';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM linea_carrito l
        JOIN producto pr
          ON pr.id_producto = l.id_producto
        WHERE l.id_carrito = v_carrito
          AND (
              NOT pr.activo
              OR pr.existencias < l.cantidad
          )
    ) THEN
        RAISE EXCEPTION 'Carrito con productos no disponibles';
    END IF;

    SELECT SUM(l.cantidad * pr.precio)::NUMERIC(14,2)
    INTO v_total
    FROM linea_carrito l
    JOIN producto pr
      ON pr.id_producto = l.id_producto
    WHERE l.id_carrito = v_carrito;

    INSERT INTO pedido (
        id_usuario,
        total,
        modalidad_entrega,
        direccion_entrega
    )
    VALUES (
        p_usuario,
        v_total,
        p_modalidad,
        p_direccion
    )
    RETURNING id_pedido INTO v_pedido;

    INSERT INTO detalle_pedido (
        id_pedido,
        id_producto,
        cantidad,
        precio_unitario
    )
    SELECT
        v_pedido,
        l.id_producto,
        l.cantidad,
        pr.precio
    FROM linea_carrito l
    JOIN producto pr
      ON pr.id_producto = l.id_producto
    WHERE l.id_carrito = v_carrito;

    DELETE FROM linea_carrito
    WHERE id_carrito = v_carrito;

    RETURN v_pedido;
END;
$$;

COMMIT;
