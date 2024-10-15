create table usuarios(
    id integer primary key,
    nome varchar2(100) not null,
    email varchar(100) unique not null,
    senha varchar(100) not null,
    data_nasc date not null,
    isAdmin number(1) not null
);
CREATE SEQUENCE SEQ_ID_USER
    START WITH 1       
    INCREMENT BY 1     
    MAXVALUE 10000;

-- COMANDOS SOBRE A TABELA EVENTOS
create table eventos(
    id integer primary key,
    titulo varchar2(100) not null,
    descricao varchar2(500) not null,
    data_inicio date not null,
    data_hora_inicio_apostas TIMESTAMP not null,
    data_hora_fim_apostas TIMESTAMP not null,
    valor_apostas_totais DECIMAL(15, 2) NOT NULL,
    isActive number(1),
    isApproved number(1) not null,
    id_usuarios_fk integer
    );

CREATE SEQUENCE SEQ_ID_EVENTOS
    START WITH 1       
    INCREMENT BY 1     
    MAXVALUE 10000;

--COMANDO PARA VER SE O EVENTO ESTA ATIVO(se a data de aposta ja começou ou se ja terminou)
CREATE OR REPLACE TRIGGER trg_set_isActive
BEFORE INSERT OR UPDATE ON eventos
FOR EACH ROW
BEGIN
    IF SYSDATE BETWEEN :NEW.data_hora_inicio_apostas AND :NEW.data_hora_fim_apostas THEN
        :NEW.isActive := 1;
    ELSE
        :NEW.isActive := 0;
    END IF;
END;
/

-- comando sobre a tabela apostas
create table apostas(
    id integer primary key,
    id_usuarios_fk integer,
    id_eventos_fk integer,
    quant_cotas integer,
    palpite number(1)
);

ALTER TABLE apostas
ADD CONSTRAINT fk_usuario_apostas
FOREIGN KEY (id_usuarios_fk)
REFERENCES usuarios (id);

ALTER TABLE apostas
ADD CONSTRAINT fk_eventos_apostas
FOREIGN KEY (id_eventos_fk)
REFERENCES eventos (id);

CREATE SEQUENCE SEQ_ID_APOSTAS
    START WITH 1       
    INCREMENT BY 1     
    MAXVALUE 10000;

--comandos sobre a tabela aprovacoes
create table  aprovacoes(
    id integer primary key,
    id_usuarios_fk integer,
    id_eventos_fk integer
);

ALTER TABLE aprovacoes
ADD CONSTRAINT fk_usuario_aprovacoes
FOREIGN KEY (id_usuarios_fk)
REFERENCES usuarios (id);

ALTER TABLE aprovacoes
ADD CONSTRAINT fk_eventos_aprovacoes
FOREIGN KEY (id_eventos_fk)
REFERENCES eventos (id);

CREATE SEQUENCE SEQ_ID_APROVACOES
    START WITH 1       
    INCREMENT BY 1     
    MAXVALUE 10000;  

-- SELECTS copia e cola
select * from usuarios;
select * from EVENTOS;
select * from apostas;