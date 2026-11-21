BEGIN;

INSERT INTO categoria(nombre) VALUES
 ('Cuerdas'),('Teclados'),('Accesorios'),('Percusion'),('Vientos')
ON CONFLICT DO NOTHING;

INSERT INTO producto(id_categoria,codigo,nombre,descripcion,precio,activo,existencias,imagen_url)
VALUES
 ((SELECT id_categoria FROM categoria WHERE nombre='Cuerdas'),
 'VIOL-AT-V80','Violin Atelier V-80','Violin de estudio avanzado',189000,TRUE,4,
 '/imagenes/productos/violin-atelier-v80.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Teclados'),
 'PIANO-AUREUM','Piano Digital Aureum','Piano digital de 88 teclas',489000,TRUE,7,
 '/imagenes/productos/piano-aureum.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Accesorios'),
 'ARCO-EBANO','Arco Ebano Concert','Arco para violin',48000,TRUE,12,
 '/imagenes/productos/arco-ebano.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Cuerdas'),
 'VIOL-EST-V40','Violin Estudio V-40','Violin para principiantes',128000,TRUE,0,
 '/imagenes/productos/violin-estudio-v40.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Cuerdas'),
 'GUIT-CLAS-01','Guitarra Clasica Cedro','Guitarra clasica de cedro',95000,TRUE,6,
 '/imagenes/productos/guitarra-clasica.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Percusion'),
 'CAJ-PER-01','Cajon Peruano','Cajon de percusion acustica',62000,TRUE,3,
 '/imagenes/productos/cajon-peruano.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Vientos'),
 'FLAU-DUL-01','Flauta Dulce Soprano','Flauta dulce para iniciacion musical',7500,TRUE,20,
 '/imagenes/productos/flauta-dulce.webp'),
 ((SELECT id_categoria FROM categoria WHERE nombre='Accesorios'),
 'AFIN-CROM-01','Afinador Cromatico','Afinador para instrumentos',12000,TRUE,15,
 NULL)
ON CONFLICT DO NOTHING;

INSERT INTO curso(nombre,descripcion,cupo_maximo,estado,id_profesor,imagen_url)
SELECT v.nombre,v.descripcion,v.cupo,v.estado,NULL,v.imagen
FROM (VALUES
 ('Piano para principiantes','Fundamentos de teclado, lectura y digitacion',12,'ABIERTO',
     '/imagenes/cursos/piano-inicial.webp'),
 ('Violin inicial','Postura, afinacion y tecnicas de arco',10,'ABIERTO',
     '/imagenes/cursos/violin-inicial.webp'),
 ('Teoria musical I','Lectura, ritmo, intervalos y armonia basica',15,'ABIERTO',
     '/imagenes/cursos/teoria-musical.webp'),
 ('Ensambles avanzados','Curso de ensamble de musica de camara',8,'CERRADO',
     '/imagenes/cursos/ensamble.webp')
) AS v(nombre,descripcion,cupo,estado,imagen)
WHERE NOT EXISTS(SELECT 1 FROM curso c WHERE c.nombre=v.nombre);

INSERT INTO horario(id_curso,dia_semana,hora_inicio,hora_fin)
SELECT c.id_curso,v.dia,v.inicio::TIME,v.fin::TIME
FROM (VALUES
 ('Piano para principiantes',1,'15:00','16:30'),
 ('Piano para principiantes',3,'15:00','16:30'),
 ('Violin inicial',2,'16:00','17:30'),
 ('Violin inicial',4,'16:00','17:30'),
 ('Teoria musical I',5,'14:00','16:00'),
 ('Ensambles avanzados',6,'09:00','11:00')
) AS v(nombre,dia,inicio,fin)
JOIN curso c ON c.nombre=v.nombre
WHERE NOT EXISTS (
 SELECT 1 FROM horario h WHERE h.id_curso=c.id_curso AND h.dia_semana=v.dia
   AND h.hora_inicio=v.inicio::TIME AND h.hora_fin=v.fin::TIME
);

INSERT INTO recomendacion(tipo,id_producto,id_curso,motivo,estado)
SELECT 'REABASTECIMIENTO',p.id_producto,NULL,
       'Dato de prueba: existencias bajas', 'PENDIENTE'
FROM producto p WHERE p.codigo='VIOL-AT-V80'
AND NOT EXISTS (
  SELECT 1 FROM recomendacion r WHERE r.id_producto=p.id_producto
   AND r.tipo='REABASTECIMIENTO' AND r.estado='PENDIENTE'
);
INSERT INTO recomendacion(tipo,id_producto,id_curso,motivo,estado)
SELECT 'PROMOCION_ACADEMICA',NULL,c.id_curso,
       'Dato de prueba: curso abierto con cupos disponibles', 'PENDIENTE'
FROM curso c WHERE c.nombre='Teoria musical I'
AND NOT EXISTS (
  SELECT 1 FROM recomendacion r WHERE r.id_curso=c.id_curso
    AND r.tipo='PROMOCION_ACADEMICA' AND r.estado='PENDIENTE'
);
COMMIT;
