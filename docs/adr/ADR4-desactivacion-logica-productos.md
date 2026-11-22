# ADR-4: Desactivación lógica y trazabilidad de productos

**Estado:** Propuesta documentada sobre una decisión implementada; pendiente de validación formal por el equipo.
**Proyecto:** Intervallum
**Área:** Catálogo-Inventario
**Responsable:** Gabriel Garro (GGarro23)

## Contexto
En Intervallum, un producto puede figurar en movimientos de inventario, carritos o pedidos. La eliminación física de productos descontinuados puede comprometer referencias históricas y trazabilidad. A la vez, el catálogo público no debería ofrecer productos inactivos.

## Decisión
Para retirar un producto del catálogo se utilizará una **desactivación lógica** mediante el campo `producto.activo` en PostgreSQL, no la eliminación física del registro.

- Las consultas públicas mostrarán únicamente productos activos.
- El panel administrativo conservará los productos desactivados para consulta histórica.
- Entradas y ajustes registrarán movimientos asociados a cada producto, conservando su trazabilidad.
- Las operaciones sobre productos inactivos deberán respetar explícitamente la regla de estado activo.

## Alternativas consideradas
1. **Eliminar físicamente** el producto: simplifica algunas operaciones pero puede afectar referencias y auditoría.
2. **Mantenerlo visible** pese a estar descontinuado: confunde la oferta disponible.
3. **Guardar su estado solo en el navegador:** no preserva la consistencia entre usuarios ni la persistencia.

## Consecuencias
**Ventajas:** preservación de relaciones históricas, continuidad del historial, catálogo coherente y posibilidad de auditar los cambios de existencias.

**Costos y riesgos:** consultas y acciones deben tratar explícitamente el campo `activo` para evitar ediciones inadvertidas; reconstruir saldos históricos requiere datos suficientes y, cuando no los haya, se mostrará «No reconstruible».

**Relación con otras decisiones:** complementa el ADR-2 (PostgreSQL como base de datos principal) sin duplicar la decisión sobre el gestor de datos.

*Pendiente de aprobación formal del equipo.*