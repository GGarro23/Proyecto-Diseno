# Proyecto Diseño & Arquitectura de Software — Etapa 2
## Minuta de implementación: Catálogo-Inventario y Academia

**Proyecto:** Tienda Musical Intervallum
**Responsable:** Gabriel Garro (GitHub: GGarro23)
**Institución:** Instituto Tecnológico de Costa Rica
**Fecha:** 21 de noviembre de 2026
**Rama:** backend

### Área asignada y objetivo
Integrar los módulos de Catálogo-Inventario y Academia con PostgreSQL/Supabase, sustituyendo los datos simulados (mocks y almacenamiento local) por consultas y operaciones persistentes. Conservar las interfaces públicas y administrativas existentes y validar las reglas de negocio y los permisos desde el servidor.

### Actividades realizadas

#### 1. Catálogo público y página de inicio
- Conexión de las páginas de catálogo y detalle de producto con las consultas de productos y categorías de PostgreSQL.
- Sustitución de mocks de productos y categorías en la página principal por consultas reales, incluyendo secciones de categorías y destacados.
- Uso de información persistente para mostrar nombres, precios, categorías, existencias e imágenes de productos.

#### 2. Gestión administrativa de productos y categorías
- Implementación de registro, edición y desactivación lógica mediante la API de productos; validaciones de campos, códigos y categorías, con autorización del permiso catalogo.administrar.
- Integración de formularios de inventario con las rutas API y actualización de la vista tras registrar, editar o desactivar.
- Conexión de categorías y consultas de inventario a PostgreSQL; conservación de registros históricos de productos inactivos.

#### 3. Existencias, movimientos y trazabilidad
- Registro en PostgreSQL de entradas y ajustes positivos y negativos del inventario; bloqueo de operaciones que dejarían existencias negativas.
- Integración del historial de movimientos y las fichas de existencias por producto.
- Corrección de la reconstrucción del saldo histórico para no asumir existencias iniciales de cero. Cuando falta información suficiente se muestra «No reconstruible».

#### 4. Imágenes de productos
- Creación de la API de imágenes de productos y de un selector visual para cargar o elegir archivos en el formulario administrativo.
- Integración de imágenes en vistas públicas y administrativas; incorporación de una fotografía de prueba del Bajo Höfner 500/1 Violin Bass.
- **Limitación documentada:** el almacenamiento implementado escribe archivos locales bajo public/imagenes/productos; no equivale a almacenamiento persistente en un despliegue con disco efímero.

#### 5. Administración académica
- Implementación de creación y modificación de cursos mediante /api/cursos y consulta de cursos, cupos y docentes desde PostgreSQL.
- Creación de /api/horarios para registrar y editar horarios, respetando restricciones de solapamiento.
- Creación de /api/profesores-cursos para obtener profesores activos y asignarlos a cursos bajo las reglas de la base de datos.

#### 6. Inscripciones y asistencias
- Creación de GET/POST /api/inscripciones, vinculando cada inscripción con el usuario de la sesión; sustitución de mocks/localStorage en el flujo del estudiante.
- Validación de cupos, estado del curso y duplicados mediante la operación y las restricciones de PostgreSQL.
- Creación de GET/POST /api/asistencias: el profesor asignado registra Presente/Ausente de estudiantes con inscripción confirmada, con validación de duplicados y persistencia transaccional.
- Conexión de los paneles docente y estudiantil a cursos, horarios, estudiantes e historial de asistencias reales.

### Tecnologías
Next.js 16, React, TypeScript, rutas API de servidor, Node.js, PostgreSQL (Supabase), biblioteca pg, Git y GitHub.

### Verificaciones realizadas
- **Productos e inventario:** alta, edición y desactivación; entradas y ajustes; consulta SQL de existencias negativas con resultado de cero filas; consulta del historial.
- **Academia:** registro y edición de cursos, creación y edición de horarios, rechazo de horarios superpuestos y asignación de docentes; verificación en DBeaver.
- **Inscripción y asistencia:** inscripción al curso «Introducción al Bajo Eléctrico», reducción de 10 a 9 cupos tras actualizar; asistencia registrada desde la sesión docente y visualizada en el panel estudiantil (100 %, una de una sesión).
- **Integración técnica:** rebase/merge con la rama principal; ejecución exitosa de npx tsc --noEmit y npm run build tras sincronizar dependencias. No se atribuyen pruebas automáticas adicionales no documentadas.

### Dificultades y soluciones
- **Datos simulados frente a datos reales:** inicialmente la pantalla administrativa mostraba cursos provenientes de mocks; se sincronizó la implementación y se cotejó /api/cursos con DBeaver.
- **Next.js 16:** corrección de configuración de runtime incompatible con cacheComponents y uso de Suspense para datos dinámicos de inicio.
- **Integración de equipo:** resolución de conflictos de rebase en formularios y rutas de inventario; integración de origin/main y sincronización de la dependencia resend de otro módulo.

### Pendientes identificados
- Probar casos extremos de permisos y concurrencia.
- Validar de extremo a extremo la compra y su impacto en inventario, así como reportes cruzados y ETL.
- Evaluar almacenamiento de imágenes persistente para despliegue.
- Actualizar el contador de cupos en la interfaz sin requerir recarga manual.

### Trazabilidad de commits (GGarro23)
- Integración inicial de PostgreSQL: 40ba5e20 y 3f6e19c5.
- CRUD e inventario: ff4cd33d y 1b8c4216.
- Imágenes: 64557ee6 y b1999d44.
- Cursos, horarios y profesores: 0ff2a1e0, 1263c191 y 0d1b079b.
- Inscripciones, asistencias y paneles: dfcdcf86, a744dd17 y 12355fba.
- Integración de main: 967b7777.

### Conclusión
Se implementó el alcance principal de Catálogo-Inventario y Academia con persistencia real. Las pruebas manuales realizadas muestran funcionamiento de las operaciones administrativas y el flujo académico entre el estudiante y la profesora. Quedan pruebas cruzadas y ajustes de despliegue antes del cierre definitivo del proyecto.

*Documento de trabajo correspondiente a la minuta en PDF preparada para la Etapa 2.*