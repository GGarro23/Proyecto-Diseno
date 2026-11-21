-- Intervallum 1.1 | PostgreSQL 15+
-- Ejecutar conectado a la BD administrativa "postgres", como usuario con CREATEDB.
-- No ejecutarlo dentro de una transaccion.
-- Si ya existe una base con ese nombre, NO se elimina: el comando fallara.
-- PostgreSQL no tiene CREATE INSTANCE: el servidor/cluster se crea fuera de SQL
-- (initdb, instalador, Docker o un servicio administrado).
CREATE DATABASE intervallum
    WITH ENCODING = 'UTF8'
         TEMPLATE = template0;
-- Tras ejecutar este archivo, conectarse a la base "intervallum".
-- Luego ejecutar 01 ... 10 en orden. No se usan comandos exclusivos de psql.
