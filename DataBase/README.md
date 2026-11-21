# Intervallum 1.1 — Base de datos PostgreSQL

Esquema inicial basado en **Intervallum1.1-7.pdf, pp. 146–154**, más las decisiones funcionales RF-01 a RF-50 y la especificación ETL. Usa **22 tablas**, tres vistas para AF06 y procedimientos/funciones para operaciones críticas. Objetivo: PostgreSQL **15+**.

## 1. ¿Cómo instalarlo?

PostgreSQL distingue **instancia o clúster del servidor** y **base de datos**. **No existe `CREATE INSTANCE` en SQL de PostgreSQL**. La instancia se instala/configura con `initdb`, Docker, un instalador o un servicio administrado. Dentro de una instancia existente sí funciona `CREATE DATABASE`.

En pgAdmin: conectate inicialmente a `postgres`, ejecutá **solo** `00_crear_base_datos.sql` en el Query Tool (fuera de una transacción). Después abrí Query Tool sobre la base **intervallum** y ejecutá los otros archivos, individualmente y **en orden**.

Con `psql` (Linux o Windows; cambiar nombre de usuario/servidor según configuración):

```bash
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f 00_crear_base_datos.sql
for f in 0[1-9]_*.sql 10_*.sql 11_*.sql; do
  psql -U postgres -d intervallum -v ON_ERROR_STOP=1 -f "$f" || break
done
```

**Importante:** cada archivo de definición usa `BEGIN/COMMIT`; si falla una sentencia, el bloque no debería considerarse aplicado. Los archivos **NO hacen DROP**. La creación está pensada para una base vacía y ejecutarse una sola vez; los archivos de prueba son mayormente reejecutables. Ejecutar `11_verificacion_basica.sql` al terminar. Debe mostrar **22 tablas**.

## 2. Archivos y dependencias

| Archivo | Contenido | Tablas |
|---|---|---:|
| `00_crear_base_datos.sql` | `CREATE DATABASE intervallum` | — |
| `01_AF01_usuarios_acceso.sql` | Usuario, Rol, Permiso, UsuarioRol, RolPermiso | 5 |
| `02_AF02_catalogo_inventario.sql` | Categoria, Producto, MovimientoInventario | 3 |
| `03_AF03_ventas_en_linea.sql` | Carrito, LineaCarrito, Pedido, DetallePedido, IntentoPagoSimulado | 5 |
| `04_AF04_gestion_pedidos_notificaciones.sql` | HistorialEstadoPedido, NotificacionCorreo | 2 |
| `05_AF05_academia.sql` | Curso, Horario, Inscripcion, Asistencia | 4 |
| `06_AF06_reportes_vistas.sql` | Tres vistas; sin tablas nuevas | 0 |
| `07_AF07_agente_recomendaciones.sql` | Recomendacion | 1 |
| `08_AF08_etl.sql` | EjecucionETL, ErrorETL | 2 |
| `09_integridad_cruzada_y_operaciones.sql` | FKs entre AF, verificaciones y funciones | 0 |
| `10_datos_prueba_sin_usuarios.sql` | Categorias, productos, cursos, horarios y recomendaciones ilustrativas | 0 |
| `11_verificacion_basica.sql` | Consultas de verificacion | — |

### Por qué hay un archivo 09 adicional

`MovimientoInventario.idPedido` apunta a `Pedido` (AF03); `MovimientoInventario.idEjecucion` apunta a `EjecucionETL` (AF08); y `NotificacionCorreo.idInscripcion` apunta a `Inscripcion` (AF05). Las columnas se crean en su AF y **las tres claves foráneas se agregan en 09** cuando existen todas las tablas.

## 3. Convenciones y decisiones

- **PostgreSQL en `snake_case`**: `idProducto` del documento se implementa como `id_producto`; `imagen_url` aparece en Producto y Curso; `contrasena_hash` representa `contraseña_hash`.
- **Una imagen por producto y curso**: la BD almacena una ruta/URL opcional, no archivos binarios.
- **Sin cuentas en los datos de prueba**: AF01 crea los **seis nombres de rol** para que el sistema pueda asignarlos. No se crean `Usuario`, ni `UsuarioRol`, contraseñas o sesiones. El seed 10 no toca esas tablas.
- **Autenticación**: las contraseñas deben hashearse en backend. El modelo no añade tabla de sesiones porque el mecanismo está pendiente de definir.
- **Estados propuestos explícitos en SQL**: `Pedido.estado_pago`: `PENDIENTE/CONFIRMADO`; `IntentoPagoSimulado` distingue `APROBADO/RECHAZADO` de `CONFIRMADO/RECHAZADO_PAGO/RECHAZADO_STOCK`; `Inscripcion`: `CONFIRMADA/FINALIZADA`; `Curso`: `ABIERTO/CERRADO`. Estos vocabularios son decisiones de implementación para hacer ejecutable el modelo, ajustables de forma coordinada con backend/UI.
- **Códigos de prueba propuestos**: `PAGO_OK` y `PAGO_RECHAZADO` (constantes en `simular_pago_pedido`). No estaban fijados literalmente en el PDF: acordarlos con frontend y pruebas.
- **Pago aprobado != pedido confirmado**: puede resultar en `RECHAZADO_STOCK` si no hay existencias. El pedido sigue `PENDIENTE` y puede reintentarse.
- **Cupos**: solo inscripciones `CONFIRMADA` ocupan lugar; `FINALIZADA` conserva historial. La funcionalidad para finalizar cursos no está definida en los RF actuales.
- **Inicialización especial de productos**: `10_datos_prueba...` introduce existencias iniciales de ejemplo sin historial de movimientos. Es solo fixture de pruebas; **las entradas/ajustes/ventas/ETL reales sí deben generar sus movimientos** dentro de la transacción. Para stock inicial operativo, usar el ETL o ajustar el bootstrap antes de producción.
- **Autorización**: las FK/CHECK/trigger no sustituyen la validación de permisos en el backend; para más garantías se recomienda otorgar a la aplicación un rol PostgreSQL con privilegios mínimos en vez de conectarse como `postgres`.
- **ETL**: mantener una transacción/SAVEPOINT por fila para que la carga parcial no deje producto sin movimiento. La función `cargar_producto_etl` recibe la ejecución creada y crea ambas piezas dentro de una sola operación. La validación del CSV y el registro del `ErrorETL` son responsabilidad del proceso ETL.
- **Horarios**: `dia_semana=1` significa lunes y `7` domingo; la BD valida choques dentro de un mismo curso y entre cursos asignados al mismo profesor.

## 4. API SQL útil para el backend

Todas estas funciones se invocan con `SELECT` y se ejecutan dentro de una transacción PostgreSQL:

```sql
-- El usuario y su carrito deben existir (el backend crea Carrito y LineaCarrito).
SELECT crear_pedido_desde_carrito(123, 'RETIRO', NULL);
SELECT * FROM simular_pago_pedido(123, 45, 'PAGO_OK');
SELECT registrar_movimiento_manual(10, 'ENTRADA_MANUAL', 4, NULL, 7);
SELECT avanzar_estado_pedido(45, 7, 'EN_PREPARACION');
SELECT inscribir_en_curso(123, 4);
SELECT cargar_producto_etl(5, 1, 'ETL-001', 'Producto prueba', 15000.00, 3);
```

Los identificadores **son ejemplos, no existen necesariamente**. El backend obtiene el usuario desde la sesión autenticada: **no confiar en IDs enviados libremente por el navegador**.

`simular_pago_pedido` bloquea la fila de pedido y los productos afectados para impedir la doble confirmación y los descuentos concurrentes. Los triggers también validan cupos, profesores, horarios y unicidad; la capa de aplicación controla el flujo y permisos completos.

## 5. Lo que no se puede expresar solo con DDL

- La autorización de todos los endpoints y la emisión/revocación de sesiones.
- El envío real del correo y el registro de respuesta del proveedor, sin revertir operaciones ya confirmadas.
- Los criterios y umbrales del agente (se revisarán después del DER).
- El parseo CSV, identificación de columnas obligatorias, errores por fila y contabilidad de filas únicas rechazadas.
- La transferencia/carga física de imágenes, aunque las rutas sí quedan almacenadas.
- La integración del frontend y los pasos de UI/UX.

**Importante para deploy:** Revisar estos archivos en un PostgreSQL real antes de producción. No se afirma que hayan sido ejecutados contra una instancia real en este entorno.
