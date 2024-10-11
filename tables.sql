create table usuarios(
    id integer primary key,
    nome varchar2(100),
    email varchar(100) unique,
    senha varchar(100),
    data_nasc date
);

select * from usuarios;