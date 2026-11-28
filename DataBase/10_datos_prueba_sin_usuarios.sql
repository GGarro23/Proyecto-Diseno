BEGIN;

INSERT INTO categoria(nombre) VALUES
 ('Cuerdas'),('Teclados'),('Accesorios'),('Percusión'),('Vientos')
ON CONFLICT DO NOTHING;

INSERT INTO producto(id_categoria,codigo,nombre,descripcion,precio,activo,existencias,imagen_url)
SELECT c.id_categoria, v.codigo, v.nombre, v.descripcion, v.precio, TRUE, v.existencias, v.imagen
FROM (VALUES
 ('Cuerdas','VIOL-AT-V80','Violín Atelier V-80','Violín 4/4 de estudio avanzado con tapa de abeto macizo y diapasón de ébano. Incluye estuche, arco y colofonia.',189000,4,
  '/imagenes/productos/violin-atelier-v80.webp'),
 ('Teclados','PIANO-AUREUM','Piano Digital Aureum','Piano digital de 88 teclas con acción contrapesada y sensibilidad al tacto. Ideal para practicar en casa, con salida para audífonos.',489000,7,
  '/imagenes/productos/piano-aureum.webp'),
 ('Accesorios','ARCO-EBANO','Arco Ébano Concert','Arco para violín 4/4 con vara de fibra de carbono, nuez de ébano y cerda natural. Ligero y equilibrado para el estudio y las presentaciones.',48000,12,
  '/imagenes/productos/arco-ebano.webp'),
 ('Cuerdas','VIOL-EST-V40','Violín Estudio V-40','Violín 4/4 pensado para quienes empiezan, con arco y estuche incluidos. Viene ajustado y listo para afinar y tocar.',128000,0,
  '/imagenes/productos/violin-estudio-v40.webp'),
 ('Cuerdas','GUIT-CLAS-01','Guitarra Clásica Cedro','Guitarra clásica con tapa de cedro y cuerdas de nailon, de sonido cálido. Una buena opción para iniciar o para el estudio diario.',95000,6,
  '/imagenes/productos/guitarra-clasica.webp'),
 ('Percusión','CAJ-PER-01','Cajón Peruano','Cajón de madera con cuerdas internas que le dan un sonido seco y brillante. Ideal para acompañar guitarra, flamenco y música acústica.',62000,3,
  '/imagenes/productos/cajon-peruano.webp'),
 ('Vientos','FLAU-DUL-01','Flauta Dulce Soprano','Flauta dulce soprano con digitación barroca, ideal para la iniciación musical. Liviana, resistente y fácil de limpiar.',7500,20,
  '/imagenes/productos/flauta-dulce.webp'),
 ('Accesorios','AFIN-CROM-01','Afinador Cromático','Afinador cromático de pinza para guitarra, violín, ukelele y otros instrumentos. Detecta la nota por vibración, incluso en lugares con ruido.',12000,15,
  '/imagenes/productos/afinador-cromatico.webp')
) AS v(categoria,codigo,nombre,descripcion,precio,existencias,imagen)
JOIN categoria c ON c.nombre = v.categoria
ON CONFLICT ((lower(btrim(codigo)))) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    imagen_url = COALESCE(producto.imagen_url, EXCLUDED.imagen_url);

UPDATE curso c
SET nombre = v.nuevo,
    descripcion = v.descripcion
FROM (VALUES
 ('Piano para principiantes','Piano para principiantes','Aprende los fundamentos del teclado: postura, lectura de partituras y digitación con ambas manos. Al terminar podrás tocar piezas sencillas y acompañamientos básicos.'),
 ('Violin inicial','Violín inicial','Trabaja la postura, la afinación y las técnicas básicas de arco desde la primera clase. Ideal si nunca has tocado violín y quieres empezar con buenas bases.'),
 ('Teoria musical I','Teoría musical I','Estudia lectura musical, ritmo, intervalos y armonía básica con ejercicios prácticos. Es la base para entender lo que tocas en cualquier instrumento.'),
 ('Ensambles avanzados','Ensambles avanzados','Toca repertorio de música de cámara en grupos pequeños junto a otros estudiantes. Desarrolla la escucha, la afinación en conjunto y la presencia escénica.')
) AS v(anterior,nuevo,descripcion)
WHERE c.nombre IN (v.anterior, v.nuevo);

INSERT INTO curso(nombre,descripcion,cupo_maximo,estado,id_profesor,imagen_url)
SELECT v.nombre,v.descripcion,v.cupo,v.estado,NULL,v.imagen
FROM (VALUES
 ('Piano para principiantes','Aprende los fundamentos del teclado: postura, lectura de partituras y digitación con ambas manos. Al terminar podrás tocar piezas sencillas y acompañamientos básicos.',12,'ABIERTO',
     '/imagenes/cursos/piano-inicial.webp'),
 ('Violín inicial','Trabaja la postura, la afinación y las técnicas básicas de arco desde la primera clase. Ideal si nunca has tocado violín y quieres empezar con buenas bases.',10,'ABIERTO',
     '/imagenes/cursos/violin-inicial.webp'),
 ('Teoría musical I','Estudia lectura musical, ritmo, intervalos y armonía básica con ejercicios prácticos. Es la base para entender lo que tocas en cualquier instrumento.',15,'ABIERTO',
     '/imagenes/cursos/teoria-musical.webp'),
 ('Ensambles avanzados','Toca repertorio de música de cámara en grupos pequeños junto a otros estudiantes. Desarrolla la escucha, la afinación en conjunto y la presencia escénica.',8,'CERRADO',
     '/imagenes/cursos/ensamble.webp')
) AS v(nombre,descripcion,cupo,estado,imagen)
WHERE NOT EXISTS(SELECT 1 FROM curso c WHERE c.nombre=v.nombre);

INSERT INTO horario(id_curso,dia_semana,hora_inicio,hora_fin)
SELECT c.id_curso,v.dia,v.inicio::TIME,v.fin::TIME
FROM (VALUES
 ('Piano para principiantes',1,'15:00','16:30'),
 ('Piano para principiantes',3,'15:00','16:30'),
 ('Violín inicial',2,'16:00','17:30'),
 ('Violín inicial',4,'16:00','17:30'),
 ('Teoría musical I',5,'14:00','16:00'),
 ('Ensambles avanzados',6,'09:00','11:00')
) AS v(nombre,dia,inicio,fin)
JOIN curso c ON c.nombre=v.nombre
WHERE NOT EXISTS (
 SELECT 1 FROM horario h WHERE h.id_curso=c.id_curso AND h.dia_semana=v.dia
   AND h.hora_inicio=v.inicio::TIME AND h.hora_fin=v.fin::TIME
);

UPDATE recomendacion SET motivo = 'Quedan pocas unidades del Violín Atelier V-80; conviene reponer antes de que se agote.'
WHERE motivo = 'Dato de prueba: existencias bajas';

UPDATE recomendacion SET motivo = 'La ocupación del curso está por debajo del 50 %; conviene promocionarlo antes del próximo ciclo.'
WHERE motivo = 'Dato de prueba: curso abierto con cupos disponibles';

INSERT INTO recomendacion(tipo,id_producto,id_curso,motivo,estado)
SELECT 'REABASTECIMIENTO',p.id_producto,NULL,
       'Quedan pocas unidades del Violín Atelier V-80; conviene reponer antes de que se agote.', 'PENDIENTE'
FROM producto p WHERE p.codigo='VIOL-AT-V80'
AND NOT EXISTS (
  SELECT 1 FROM recomendacion r WHERE r.id_producto=p.id_producto
   AND r.tipo='REABASTECIMIENTO'
   AND (r.estado='PENDIENTE' OR r.motivo = 'Quedan pocas unidades del Violín Atelier V-80; conviene reponer antes de que se agote.')
);

INSERT INTO recomendacion(tipo,id_producto,id_curso,motivo,estado)
SELECT 'PROMOCION_ACADEMICA',NULL,c.id_curso,
       'La ocupación del curso está por debajo del 50 %; conviene promocionarlo antes del próximo ciclo.', 'PENDIENTE'
FROM curso c WHERE c.nombre='Teoría musical I'
AND NOT EXISTS (
  SELECT 1 FROM recomendacion r WHERE r.id_curso=c.id_curso
    AND r.tipo='PROMOCION_ACADEMICA'
    AND (r.estado='PENDIENTE' OR r.motivo = 'La ocupación del curso está por debajo del 50 %; conviene promocionarlo antes del próximo ciclo.')
);

COMMIT;