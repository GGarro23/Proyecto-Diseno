-- Restricciones y funciones que involucran varias AF.
-- Ejecutar SOLO despues de 01...08. Todas las funciones se ejecutan
-- dentro de la transaccion del llamador; el backend controla autorizacion.
BEGIN;

-- RI-05, RI-11: FKs cruzadas diferidas hasta existir sus tablas de destino.
ALTER TABLE movimiento_inventario ADD CONSTRAINT fk_movimiento_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE RESTRICT;
ALTER TABLE movimiento_inventario ADD CONSTRAINT fk_movimiento_ejecucion
    FOREIGN KEY (id_ejecucion) REFERENCES ejecucion_etl(id_ejecucion) ON DELETE RESTRICT;
ALTER TABLE notificacion_correo ADD CONSTRAINT fk_notificacion_inscripcion
    FOREIGN KEY (id_inscripcion) REFERENCES inscripcion(id_inscripcion) ON DELETE RESTRICT;

-- RI-07: comprobacion DIFERIDA al COMMIT: pedido con >=1 detalle y total exacto.
-- La creacion del pedido y sus detalles debe ocurrir dentro de UNA transaccion.
CREATE FUNCTION comprobar_total_y_detalles_pedido() RETURNS TRIGGER AS $$
DECLARE v_id BIGINT; v_total NUMERIC(14,2); v_suma NUMERIC(14,2); v_num BIGINT;
BEGIN
    v_id := CASE WHEN TG_TABLE_NAME='pedido' THEN NEW.id_pedido
                 WHEN TG_OP='DELETE' THEN OLD.id_pedido ELSE NEW.id_pedido END;
    SELECT total INTO v_total FROM pedido WHERE id_pedido=v_id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    SELECT count(*),coalesce(sum(cantidad*precio_unitario),0)
      INTO v_num,v_suma FROM detalle_pedido WHERE id_pedido=v_id;
    IF v_num=0 OR v_total<>v_suma THEN
        RAISE EXCEPTION 'Pedido %: requiere detalles y total igual a su suma (actual %, calculado %)',
             v_id, v_total, v_suma;
    END IF;
    IF TG_TABLE_NAME='detalle_pedido' AND TG_OP='UPDATE' AND OLD.id_pedido<>NEW.id_pedido THEN
        SELECT total INTO v_total FROM pedido WHERE id_pedido=OLD.id_pedido;
        IF FOUND THEN
            SELECT count(*),coalesce(sum(cantidad*precio_unitario),0)
             INTO v_num,v_suma FROM detalle_pedido WHERE id_pedido=OLD.id_pedido;
            IF v_num=0 OR v_total<>v_suma THEN
                RAISE EXCEPTION 'Pedido %: detalles o total invalidos',OLD.id_pedido;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER ct_pedido_detalles
AFTER INSERT OR UPDATE ON pedido DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION comprobar_total_y_detalles_pedido();
CREATE CONSTRAINT TRIGGER ct_detalle_total
AFTER INSERT OR UPDATE OR DELETE ON detalle_pedido DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION comprobar_total_y_detalles_pedido();

-- El historial comercial queda inmutable al confirmar el pedido.
CREATE FUNCTION proteger_detalle_confirmado() RETURNS TRIGGER AS $$
DECLARE v_id BIGINT;
BEGIN
    v_id := CASE WHEN TG_OP='DELETE' THEN OLD.id_pedido ELSE NEW.id_pedido END;
    IF EXISTS (SELECT 1 FROM pedido WHERE id_pedido=v_id AND estado_pago='CONFIRMADO') THEN
       RAISE EXCEPTION 'No se pueden modificar detalles de un pedido confirmado';
    END IF;
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_proteger_detalle
BEFORE INSERT OR UPDATE OR DELETE ON detalle_pedido
FOR EACH ROW EXECUTE FUNCTION proteger_detalle_confirmado();

-- RI-08/09: no se puede revertir un pedido confirmado a pendiente.
CREATE FUNCTION impedir_desconfirmar_pedido() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_pago='CONFIRMADO' AND NEW.estado_pago<>'CONFIRMADO' THEN
       RAISE EXCEPTION 'No se puede desconfirmar un pedido confirmado';
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_impedir_desconfirmar
BEFORE UPDATE OF estado_pago ON pedido
FOR EACH ROW EXECUTE FUNCTION impedir_desconfirmar_pedido();

-- RI-08/09: una confirmacion nueva debe producir un intento confirmado y
-- exactamente las salidas de inventario de sus productos. Chequeo diferido.
CREATE FUNCTION comprobar_confirmacion_pedido() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_pago='PENDIENTE' AND NEW.estado_pago='CONFIRMADO' THEN
      IF NOT EXISTS (SELECT 1 FROM intento_pago_simulado
                     WHERE id_pedido=NEW.id_pedido
                       AND resultado_confirmacion='CONFIRMADO') THEN
        RAISE EXCEPTION 'El pedido % no tiene intento de pago confirmado',NEW.id_pedido;
      END IF;
      IF EXISTS (
         SELECT 1 FROM detalle_pedido d
         WHERE d.id_pedido=NEW.id_pedido AND
          (SELECT coalesce(sum(m.cantidad),0) FROM movimiento_inventario m
           WHERE m.id_pedido=d.id_pedido AND m.id_producto=d.id_producto
             AND m.tipo='VENTA') <> d.cantidad
      ) THEN
        RAISE EXCEPTION 'El pedido % no tiene los descuentos registrados',NEW.id_pedido;
      END IF;
    END IF;
    RETURN NULL;
END; $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER ct_confirmacion_pedido
AFTER UPDATE ON pedido DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION comprobar_confirmacion_pedido();

-- RF-23: pedido pendiente CON copia de precios historicos del carrito.
-- No descuenta existencias; las verifica nuevamente al confirmar el pago.
CREATE FUNCTION crear_pedido_desde_carrito(
    p_usuario BIGINT, p_modalidad VARCHAR, p_direccion TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE v_carrito BIGINT; v_total NUMERIC(14,2); v_pedido BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE id_usuario=p_usuario AND activo) THEN
      RAISE EXCEPTION 'Usuario inexistente o inactivo';
    END IF;
    SELECT id_carrito INTO v_carrito FROM carrito WHERE id_usuario=p_usuario FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Usuario sin carrito'; END IF;
    PERFORM 1 FROM linea_carrito WHERE id_carrito=v_carrito FOR UPDATE;
    IF NOT EXISTS (SELECT 1 FROM linea_carrito WHERE id_carrito=v_carrito) THEN
      RAISE EXCEPTION 'No se puede comprar con carrito vacio';
    END IF;
    IF EXISTS (
       SELECT 1 FROM linea_carrito l JOIN producto pr ON pr.id_producto=l.id_producto
       WHERE l.id_carrito=v_carrito AND (NOT pr.activo OR pr.existencias<l.cantidad)
    ) THEN RAISE EXCEPTION 'Carrito con productos no disponibles'; END IF;
    SELECT sum(l.cantidad * pr.precio)::NUMERIC(14,2) INTO v_total
    FROM linea_carrito l JOIN producto pr ON pr.id_producto=l.id_producto
    WHERE l.id_carrito=v_carrito;
    INSERT INTO pedido(id_usuario,total,modalidad_entrega,direccion_entrega)
    VALUES (p_usuario,v_total,p_modalidad,p_direccion) RETURNING id_pedido INTO v_pedido;
    INSERT INTO detalle_pedido(id_pedido,id_producto,cantidad,precio_unitario)
    SELECT v_pedido,l.id_producto,l.cantidad,pr.precio
    FROM linea_carrito l JOIN producto pr ON pr.id_producto=l.id_producto
    WHERE l.id_carrito=v_carrito;
    RETURN v_pedido;
END; $$ LANGUAGE plpgsql;

-- RF-25: codigo determinista elegido para este prototipo:
-- PAGO_OK => aprobado; PAGO_RECHAZADO => rechazado.
-- Ambos registran el intento; la simulacion aprobada puede fallar por stock.
-- Bloquea el pedido y los productos involucrados; impide doble descuento.
CREATE FUNCTION simular_pago_pedido(
    p_usuario BIGINT, p_pedido BIGINT, p_codigo VARCHAR
) RETURNS TABLE(resultado_simulacion TEXT, resultado_confirmacion TEXT) AS $$
DECLARE v_estado VARCHAR(12);
BEGIN
    IF p_codigo NOT IN ('PAGO_OK','PAGO_RECHAZADO') OR p_codigo IS NULL THEN
        RAISE EXCEPTION 'Codigo de prueba no reconocido';
    END IF;
    SELECT estado_pago INTO v_estado FROM pedido
    WHERE id_pedido=p_pedido AND id_usuario=p_usuario FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pedido inexistente o no pertenece al usuario'; END IF;
    IF v_estado<>'PENDIENTE' THEN RAISE EXCEPTION 'Este pedido ya fue confirmado'; END IF;
    IF p_codigo='PAGO_RECHAZADO' THEN
        INSERT INTO intento_pago_simulado(id_pedido,codigo_escenario,
            resultado_simulacion,resultado_confirmacion)
        VALUES (p_pedido,p_codigo,'RECHAZADO','RECHAZADO_PAGO');
        RETURN QUERY SELECT 'RECHAZADO'::TEXT,'RECHAZADO_PAGO'::TEXT;
        RETURN;
    END IF;
    -- Orden estable de bloqueos para reducir riesgo de interbloqueos.
    PERFORM pr.id_producto FROM producto pr
    JOIN detalle_pedido d ON d.id_producto=pr.id_producto
    WHERE d.id_pedido=p_pedido ORDER BY pr.id_producto FOR UPDATE OF pr;
    IF EXISTS (
        SELECT 1 FROM detalle_pedido d JOIN producto pr ON pr.id_producto=d.id_producto
        WHERE d.id_pedido=p_pedido AND (NOT pr.activo OR pr.existencias<d.cantidad)
    ) THEN
        INSERT INTO intento_pago_simulado(id_pedido,codigo_escenario,
            resultado_simulacion,resultado_confirmacion)
        VALUES (p_pedido,p_codigo,'APROBADO','RECHAZADO_STOCK');
        RETURN QUERY SELECT 'APROBADO'::TEXT,'RECHAZADO_STOCK'::TEXT;
        RETURN;
    END IF;
    UPDATE producto pr SET existencias=pr.existencias-d.cantidad
    FROM detalle_pedido d
    WHERE d.id_pedido=p_pedido AND d.id_producto=pr.id_producto;
    INSERT INTO movimiento_inventario(id_producto,tipo,cantidad,id_pedido)
    SELECT id_producto,'VENTA',cantidad,p_pedido FROM detalle_pedido
    WHERE id_pedido=p_pedido;
    UPDATE pedido SET estado_pago='CONFIRMADO',fecha_confirmacion=NOW()
    WHERE id_pedido=p_pedido;
    INSERT INTO intento_pago_simulado(id_pedido,codigo_escenario,
        resultado_simulacion,resultado_confirmacion)
    VALUES (p_pedido,p_codigo,'APROBADO','CONFIRMADO');
    RETURN QUERY SELECT 'APROBADO'::TEXT,'CONFIRMADO'::TEXT;
END; $$ LANGUAGE plpgsql;

-- RI-04: ajustes y entradas manuales atomicos.
CREATE FUNCTION registrar_movimiento_manual(
    p_producto BIGINT,p_tipo VARCHAR,p_cantidad INTEGER,
    p_motivo TEXT,p_responsable BIGINT
) RETURNS BIGINT AS $$
DECLARE v_movimiento BIGINT; v_delta INTEGER;
BEGIN
    IF p_tipo NOT IN ('ENTRADA_MANUAL','AJUSTE_POSITIVO','AJUSTE_NEGATIVO')
       OR p_tipo IS NULL OR p_cantidad IS NULL OR p_cantidad<=0 THEN
       RAISE EXCEPTION 'Movimiento manual invalido';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario
        JOIN rol r ON r.id_rol=ur.id_rol
        WHERE u.id_usuario=p_responsable AND u.activo AND r.nombre='Administrador'
    ) THEN RAISE EXCEPTION 'Se requiere un Administrador activo'; END IF;
    v_delta := CASE WHEN p_tipo='AJUSTE_NEGATIVO' THEN -p_cantidad ELSE p_cantidad END;
    UPDATE producto SET existencias=existencias+v_delta
    WHERE id_producto=p_producto AND existencias+v_delta>=0;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto inexistente o existencias insuficientes'; END IF;
    INSERT INTO movimiento_inventario(id_producto,tipo,cantidad,motivo,id_responsable)
    VALUES (p_producto,p_tipo,p_cantidad,p_motivo,p_responsable)
    RETURNING id_movimiento INTO v_movimiento;
    RETURN v_movimiento;
END; $$ LANGUAGE plpgsql;

-- AF-04, HU-09: transiciones sin saltos y con historial en la misma transaccion.
CREATE FUNCTION avanzar_estado_pedido(
    p_pedido BIGINT,p_responsable BIGINT,p_estado_nuevo VARCHAR
) RETURNS BIGINT AS $$
DECLARE v_pedido pedido%ROWTYPE; v_cambio BIGINT; v_valido BOOLEAN:=FALSE;
BEGIN
    IF NOT EXISTS (
       SELECT 1 FROM usuario u JOIN usuario_rol ur ON ur.id_usuario=u.id_usuario
       JOIN rol r ON r.id_rol=ur.id_rol
       WHERE u.id_usuario=p_responsable AND u.activo AND r.nombre='Encargado de pedidos'
    ) THEN RAISE EXCEPTION 'Requiere Encargado de pedidos activo'; END IF;
    SELECT * INTO v_pedido FROM pedido WHERE id_pedido=p_pedido FOR UPDATE;
    IF NOT FOUND OR v_pedido.estado_pago<>'CONFIRMADO' THEN
       RAISE EXCEPTION 'Solo se puede actualizar un pedido confirmado';
    END IF;
    v_valido :=
       (v_pedido.estado_operativo='PENDIENTE' AND p_estado_nuevo='EN_PREPARACION')
       OR (v_pedido.modalidad_entrega='ENVIO' AND
           ((v_pedido.estado_operativo='EN_PREPARACION' AND p_estado_nuevo='EMPACADO')
            OR (v_pedido.estado_operativo='EMPACADO' AND p_estado_nuevo='ENVIADO')))
       OR (v_pedido.modalidad_entrega='RETIRO' AND
           ((v_pedido.estado_operativo='EN_PREPARACION' AND p_estado_nuevo='LISTO_RETIRO')
            OR (v_pedido.estado_operativo='LISTO_RETIRO' AND p_estado_nuevo='RETIRADO')));
    IF NOT v_valido OR v_valido IS NULL THEN
        RAISE EXCEPTION 'Transicion de estado no permitida';
    END IF;
    UPDATE pedido SET estado_operativo=p_estado_nuevo WHERE id_pedido=p_pedido;
    INSERT INTO historial_estado_pedido(id_pedido,estado_anterior,estado_nuevo,id_responsable)
    VALUES (p_pedido,v_pedido.estado_operativo,p_estado_nuevo,p_responsable)
    RETURNING id_cambio INTO v_cambio;
    RETURN v_cambio;
END; $$ LANGUAGE plpgsql;

-- RF-37: inscripcion unica, cupos concurrentes y asignacion de rol mediante
-- triggers AF05; todo se confirma o se revierte junto.
CREATE FUNCTION inscribir_en_curso(p_usuario BIGINT,p_curso BIGINT)
RETURNS BIGINT AS $$
DECLARE v_inscripcion BIGINT;
BEGIN
    INSERT INTO inscripcion(id_usuario,id_curso,estado)
    VALUES (p_usuario,p_curso,'CONFIRMADA')
    RETURNING id_inscripcion INTO v_inscripcion;
    RETURN v_inscripcion;
END; $$ LANGUAGE plpgsql;

-- RF-49, HU-15: operacion atomica POR FILA para un producto nuevo de ETL.
-- Para permitir rechazo parcial del CSV, el backend usa SAVEPOINT por fila.
CREATE FUNCTION cargar_producto_etl(
    p_ejecucion BIGINT,p_categoria BIGINT,p_codigo VARCHAR,
    p_nombre VARCHAR,p_precio NUMERIC,p_existencias INTEGER
) RETURNS BIGINT AS $$
DECLARE v_producto BIGINT;
BEGIN
    IF NOT EXISTS(SELECT 1 FROM ejecucion_etl WHERE id_ejecucion=p_ejecucion) THEN
      RAISE EXCEPTION 'La ejecucion ETL no existe';
    END IF;
    IF p_existencias IS NULL OR p_existencias<0 THEN
      RAISE EXCEPTION 'Existencias ETL invalidas';
    END IF;
    INSERT INTO producto(id_categoria,codigo,nombre,precio,existencias)
    VALUES(p_categoria,btrim(p_codigo),btrim(p_nombre),p_precio,0)
    RETURNING id_producto INTO v_producto;
    IF p_existencias>0 THEN
       UPDATE producto SET existencias=p_existencias WHERE id_producto=v_producto;
       INSERT INTO movimiento_inventario(id_producto,tipo,cantidad,id_ejecucion)
       VALUES(v_producto,'ENTRADA_ETL',p_existencias,p_ejecucion);
    END IF;
    RETURN v_producto;
END; $$ LANGUAGE plpgsql;

COMMIT;
