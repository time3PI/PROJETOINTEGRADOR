create table USUARIO(
    id_usuario integer primary key,
    nome varchar2(100) not null,
    email varchar2(100) unique not null,
    senha varchar2(100) not null,
    data_nasc date not null,
    isAdmin number(1) not null,
    token varchar2(10) not null
);

CREATE SEQUENCE SEQ_ID_USER
    START WITH 1       
    INCREMENT BY 1;

create table EVENTO(
    id_evento integer primary key,
    titulo varchar2(100) not null,
    descricao varchar2(500) not null,
    data_inicio date not null,
    data_hora_inicio_apostas TIMESTAMP not null,
    data_hora_fim_apostas TIMESTAMP not null,
    status VARCHAR2(20) CHECK (status IN ('aguarda aprovação', 'suspenso', 'aprovado', 'finalizado')) NOT NULL,
    categoria VARCHAR2(30) CHECK (categoria IN('olimpíada', 'catástrofes', 'eleições', 'bolsa de valores', 'futebol', 'clima', 'outros')) not null,
    id_usuario_fk integer,
    FOREIGN KEY (id_usuario_fk) REFERENCES USUARIO(id_usuario)
    );

CREATE SEQUENCE SEQ_ID_EVENTOS
    START WITH 1       
    INCREMENT BY 1;

CREATE TABLE APOSTA (
    id_usuario_fk INTEGER,
    id_evento_fk INTEGER,
    quant_cotas INTEGER NOT NULL,
    palpite NUMBER(1) NOT NULL,
    FOREIGN KEY (id_usuario_fk) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (id_evento_fk) REFERENCES EVENTO(id_evento),
    PRIMARY KEY (id_usuario_fk, id_evento_fk)
);

create table CARTEIRA(
    id_usuario_fk integer NOT NULL,
    valor_total integer NOT NULL,
    FOREIGN KEY (id_usuario_fk) REFERENCES USUARIO(id_usuario),
    PRIMARY KEY(id_usuario_fk)
);

create table TRANSACAO(
    id_transacao integer primary key,
    valor_total decimal(10,2) not null,
    data_transacao date not null,
    tipo varchar2(20) CHECK (tipo IN ('apostado', 'saque', 'adicionado', 'lucro')) NOT NULL,
    id_carteira_fk integer not null,
    FOREIGN KEY (id_carteira_fk) REFERENCES CARTEIRA(id_usuario_fk)
);

CREATE SEQUENCE SEQ_ID_TRANSACAO
    START WITH 1       
    INCREMENT BY 1;


CREATE OR REPLACE TRIGGER trg_insert_carteira
AFTER INSERT ON USUARIO
FOR EACH ROW
BEGIN
    INSERT INTO CARTEIRA (id_usuario_fk, valor_total)
    VALUES (:NEW.id_usuario, 0);
END;