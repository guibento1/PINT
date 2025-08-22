/* CREATE TABLES */


-- UTILIZADORES


CREATE TABLE Utilizadores (

    idUtilizador BIGINT GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR(60) NOT NULL,
    email VARCHAR(60) UNIQUE NOT NULL,
    salt CHAR(16) NOT NULL,
    passwordhash CHAR(128) NOT NULL, -- pbkdf2Sync(password, salt, 1000, 64, 'sha512')    
    dataRegisto DATE,
    morada VARCHAR(100),
    telefone CHAR(9),
    foto VARCHAR(300),
    ativo BOOLEAN DEFAULT TRUE,

    CONSTRAINT CHK_EMAIL CHECK (email ~ '^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*@[a-z]+(\.[a-z]+)+$'),
    CONSTRAINT CHK_PHONE CHECK (telefone ~ '^9[1-6][0-9]{7}$'),
    CONSTRAINT CHK_PASSNOTNULL CHECK (NOT ativo OR passwordhash IS NOT NULL);
    CONSTRAINT CHK_SALT CHECK (passwordhash IS NULL OR salt IS NOT NULL);
    CONSTRAINT UTILIZADOR_PK PRIMARY KEY(idUtilizador)

);


CREATE TABLE Admin (

    idAdmin BIGINT UNIQUE GENERATED ALWAYS AS IDENTITY,
    utilizador BIGINT,
    ativo BOOLEAN DEFAULT TRUE,

    CONSTRAINT ADMIN_PK PRIMARY KEY(idAdmin,utilizador),
    CONSTRAINT ADMIN_UTILIZADOR_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador)

);



CREATE TABLE Formando (

    idFormando BIGINT UNIQUE GENERATED ALWAYS AS IDENTITY,
    utilizador BIGINT,
    ativo BOOLEAN DEFAULT TRUE,

    CONSTRAINT FORMANDO_PK PRIMARY KEY(idFormando,utilizador),
    CONSTRAINT FORMANDO_UTILIZADOR_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador)

);


CREATE TABLE Formador (

    idFormador BIGINT UNIQUE GENERATED ALWAYS AS IDENTITY,
    utilizador BIGINT,
    ativo BOOLEAN DEFAULT TRUE,

    CONSTRAINT FORMADOR_PK PRIMARY KEY(idFormador,utilizador),
    CONSTRAINT FORMADOR_UTILIZADOR_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador)

);

-- Classificadores 


CREATE TABLE TipoDenuncia (

    idTipoDenuncia BIGINT GENERATED ALWAYS AS IDENTITY,
    designacao VARCHAR(60) NOT NULL,

    CONSTRAINT TIPODENUNCIA_PK PRIMARY KEY(idTipoDenuncia)

);


CREATE TABLE TipoMaterial (

    idTipoMaterial BIGINT GENERATED ALWAYS AS IDENTITY,
    designacao VARCHAR(60) NOT NULL,

    CONSTRAINT TIPOMATERIAL_PK PRIMARY KEY(idTipoMaterial)

);


CREATE TABLE Categoria (

    idCategoria BIGINT GENERATED ALWAYS AS IDENTITY,
    designacao VARCHAR(60) NOT NULL,

    CONSTRAINT CATEGORIA_PK PRIMARY KEY(idCategoria)

);


CREATE TABLE Area (

    idArea BIGINT GENERATED ALWAYS AS IDENTITY,
    categoria BIGINT,
    designacao VARCHAR(60) NOT NULL,

    CONSTRAINT AREA_PK PRIMARY KEY(idArea),
    CONSTRAINT CATEGORIA_AREA_FK FOREIGN KEY (categoria) REFERENCES Categoria(idCategoria)

);

CREATE TABLE Topico (

    idTopico BIGINT GENERATED ALWAYS AS IDENTITY,
    designacao VARCHAR(60) NOT NULL,

    CONSTRAINT TOPICO_PK PRIMARY KEY(idTopico)

);


CREATE TABLE TopicoArea (

    topico BIGINT,
    area BIGINT,

    CONSTRAINT TOPICOAREA_PK PRIMARY KEY(topico,area),
    CONSTRAINT AREA_TOPICOAREA_FK FOREIGN KEY (area) REFERENCES Area(idArea),
    CONSTRAINT TOPICO_TOPICOAREA_FK FOREIGN KEY (topico) REFERENCES Topico(idTopico)

);

-- Notificacoes


CREATE TABLE CanalNotificacoes (

    idCanalNotificacoes BIGINT GENERATED ALWAYS AS IDENTITY,
    descricao VARCHAR(300),

    CONSTRAINT CANALNOTIFICACOES_PK PRIMARY KEY(idCanalNotificacoes)
);


CREATE TABLE HistoricoNotificacoes (

    idNotificacao BIGINT GENERATED ALWAYS AS IDENTITY,
    canal  BIGINT NOT NULL,
    titulo VARCHAR(60) NOT NULL,
    conteudo TEXT NOT NULL,
    instante TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT CANAL_HISTORICONOTIFICACOES_FK FOREIGN KEY (canal) REFERENCES CanalNotificacoes(idcanalnotificacoes),
    CONSTRAINT HISTORICONOTIFICACOES_PK PRIMARY KEY(idNotificacao)

);


-- CREATE TABLE Notificacao (
--
--     idNotificacao BIGINT GENERATED ALWAYS AS IDENTITY,
--     conteudo VARCHAR(300),
--     instante TIMESTAMP NOT NULL,
--
--     CONSTRAINT NOTIFICACAO_PK PRIMARY KEY(idNotificacao)
-- );
--
--
-- CREATE TABLE NotificacaoPessoal (
--
--     idNotificacao BIGINT,
--     utilizador BIGINT,
--
--     CONSTRAINT NOTIFICACAOPESSOAL_PK PRIMARY KEY(idNotificacao,utilizador),
--     CONSTRAINT UTILIZADOR_NOTIFICACAOPESSOAL_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador),
--     CONSTRAINT NOTIFICACAO_NOTIFICACAOPESSOAL_FK FOREIGN KEY (idNotificacao) REFERENCES Notificacao(idNotificacao)
--
--
-- );
--
-- CREATE TABLE NotificacaoGeral (
--
--     idNotificacao BIGINT,
--     canal BIGINT,
--
--     CONSTRAINT NOTIFICAOGERAL_PK PRIMARY KEY(idNotificacao,canal),
--     CONSTRAINT CANAL_NOTIFICACAOPESSOAL_FK FOREIGN KEY (canal) REFERENCES CanalNotificacoes(idCanalNotificacoes),
--     CONSTRAINT NOTIFICACAO_NOTIFICACAOPESSOAL_FK FOREIGN KEY (idNotificacao) REFERENCES Notificacao(idNotificacao)
-- );



-- CURSOS


CREATE TABLE Curso (

    idCurso BIGINT GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR(60) NOT NULL,
    disponivel BOOLEAN NOT NULL,
    inicioDeInscricoes TIMESTAMP NOT NULL,
    canal BIGINT NOT NULL,
    fimDeInscricoes TIMESTAMP,
    planoCurricular TEXT,
    thumbnail VARCHAR(300),


    CONSTRAINT CURSO_PK PRIMARY KEY(idCurso),
    CONSTRAINT CANAL_CURSO_FK FOREIGN KEY (canal) REFERENCES CanalNotificacoes(idCanalNotificacoes)

);


CREATE TABLE CursoAssincrono (

    idCursoAssincrono BIGINT UNIQUE GENERATED ALWAYS AS IDENTITY,
    curso BIGINT,


    CONSTRAINT CURSOASSINCRONO_PK PRIMARY KEY(idCursoAssincrono,curso),
    CONSTRAINT CURSO_CURSOASSINCRONO_FK FOREIGN KEY (curso) REFERENCES Curso(idCurso)

);


CREATE TABLE CursoSincrono (

    idCursoSincrono BIGINT UNIQUE GENERATED ALWAYS AS IDENTITY,
    curso BIGINT,
    formador BIGINT NOT NULL,
    nHoras INTEGER NOT NULL,
    inicio DATE NOT NULL,
    fim DATE NOT NULL,
    maxinscricoes BIGINT,


    CONSTRAINT CURSOSINCRONO_PK PRIMARY KEY(idCursoSincrono,curso),
    CONSTRAINT CURSO_CURSOSINCRONO_FK FOREIGN KEY (curso) REFERENCES Curso(idCurso),
    CONSTRAINT FORMADOR_CURSOSINCRONO_FK FOREIGN KEY (formador) REFERENCES Formador(idFormador)

);

-- Conteudo Do Curso


CREATE TABLE Licao (

    idLicao BIGINT UNIQUE GENERATED ALWAYS AS IDENTITY,
    curso BIGINT,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,


    CONSTRAINT LICAO_PK PRIMARY KEY(idLicao,curso),
    CONSTRAINT CURSO_LICAO_FK FOREIGN KEY (curso) REFERENCES Curso(idCurso)

);


CREATE TABLE Sessao (

    idSessao BIGINT GENERATED ALWAYS AS IDENTITY,
    licao BIGINT,
    cursoSincrono BIGINT,
    linkSessao VARCHAR(300) NOT NULL,
    dataHora TIMESTAMP NOT NULL,
    duracaoHoras BIGINT NOT NULL DEFAULT 1,
    plataformaVideoConferencia VARCHAR(60),


    CONSTRAINT SESSAO_PK PRIMARY KEY(idSessao),
    CONSTRAINT LICAO_CURSO_U UNIQUE (licao,cursoSincrono),
    CONSTRAINT LICAO_SESSAO_FK FOREIGN KEY (licao) REFERENCES Licao(idLicao),
    CONSTRAINT CURSOSINCRONO_SESSAO_FK FOREIGN KEY (cursoSincrono) REFERENCES CursoSincrono(idCursoSincrono)

);


CREATE TABLE Material (

    idMaterial BIGINT GENERATED ALWAYS AS IDENTITY,
    titulo VARCHAR(60) NOT NULL,
    referencia VARCHAR(300) NOT NULL,
    tipo BIGINT NOT NULL,
    criador BIGINT NOT NULL,

    CONSTRAINT MATERIAL_PK PRIMARY KEY(idMaterial),
    CONSTRAINT TIPOMATERIAL_MATERIAL_FK FOREIGN KEY (tipo) REFERENCES TipoMaterial(idTipoMaterial),
    CONSTRAINT UTILIZADOR_MATERIAL_FK FOREIGN KEY (criador) REFERENCES Utilizadores(idUtilizador)

);


CREATE TABLE Post (

    idPost BIGINT GENERATED ALWAYS AS IDENTITY,
    utilizador BIGINT NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    topico BIGINT NOT NULL,
    conteudo TEXT NOT NULL,
    pontuacao BIGINT NOT NULL DEFAULT 0,
    nComentarios BIGINT NOT NULL DEFAULT 0,


    CONSTRAINT POST_PK PRIMARY KEY(idPost),
    CONSTRAINT UTILIZADOR_POST_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador),
    CONSTRAINT TOPICO_POST_FK FOREIGN KEY (topico) REFERENCES Topico(idtopico)

);

CREATE TABLE Comentario (

    idComentario BIGINT GENERATED ALWAYS AS IDENTITY,
    utilizador BIGINT NOT NULL,
    conteudo TEXT NOT NULL,
    pontuacao BIGINT NOT NULL DEFAULT 0,


    CONSTRAINT COMENTARIO_PK PRIMARY KEY(idComentario),
    CONSTRAINT UTILIZADOR_COMENTARIO_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador)

);
CREATE TABLE RespostaPost (

    idComentario BIGINT,
    post BIGINT NOT NULL,


    CONSTRAINT RESPOSTAPOST_PK PRIMARY KEY(idComentario),
    CONSTRAINT COMENTARIO_RESPOSTAPOST_FK FOREIGN KEY (idcomentario) REFERENCES Comentario(idComentario),
    CONSTRAINT POST_RESPOSTAPOST_FK FOREIGN KEY (post) REFERENCES Post(idPost)

);


CREATE TABLE RespostaComentario (

    idComentario BIGINT,
    comentario BIGINT NOT NULL,


    CONSTRAINT RESPOSTACOMENTARIO_PK PRIMARY KEY(idComentario),
    CONSTRAINT COMENTARIO_RESPOSTACOMENTARIO_FK FOREIGN KEY (idComentario) REFERENCES Comentario(idComentario),
    CONSTRAINT COMENTARIOORIGINAL_RESPOSTACOMENTARIO_FK FOREIGN KEY (comentario) REFERENCES Comentario(idComentario)

);

-- Denuncia 


CREATE TABLE Denuncia (

    idDenuncia BIGINT GENERATED ALWAYS AS IDENTITY,
    tipo BIGINT NOT NULL,
    descricao VARCHAR(300) NOT NULL,
    criador BIGINT,

    CONSTRAINT DENUNCIA_PK PRIMARY KEY(idDenuncia),
    CONSTRAINT TIPO_DENUNCIA_FK FOREIGN KEY (tipo) REFERENCES TipoDenuncia(idTipoDenuncia),
    CONSTRAINT UTILIZADOR_DENUNCIA_FK FOREIGN KEY (criador) REFERENCES Utilizadores(idUtilizador)

);


CREATE TABLE DenunciaPost (

    denuncia BIGINT,
    post BIGINT,

    CONSTRAINT DENUNCIAPOST_PK PRIMARY KEY(denuncia),
    CONSTRAINT POST_DENUNCIAPOST_FK FOREIGN KEY (post) REFERENCES Post(idPost),
    CONSTRAINT DENUNCIA_DENUNCIAPOST_FK FOREIGN KEY (denuncia) REFERENCES Denuncia(idDenuncia)

);


CREATE TABLE DenunciaComentario (

    denuncia BIGINT,
    comentario BIGINT,

    CONSTRAINT DENUNCIACOMENTARIO_PK PRIMARY KEY(denuncia),
    CONSTRAINT COMENTARIO_DENUNCIACOMENTARIO_FK FOREIGN KEY (comentario) REFERENCES Comentario(idComentario),
    CONSTRAINT DENUNCIA_DENUNCIACOMENTARIO_FK FOREIGN KEY (denuncia) REFERENCES Denuncia(idDenuncia)

);


-- Relacoes

CREATE TABLE LicaoMaterial (

    material BIGINT,
    licao BIGINT,

    CONSTRAINT LICAOMATERIAL_PK PRIMARY KEY(material,licao),
    CONSTRAINT LICAO_LICAOMATERIAL_FK FOREIGN KEY (licao,curso) REFERENCES Licao(idLicao,curso),
    CONSTRAINT MATERIAL_LICAOMATERIAL_FK FOREIGN KEY (material) REFERENCES Material(idMaterial)

);

CREATE TABLE CursoTopico (

    curso BIGINT,
    topico BIGINT,

    CONSTRAINT CURSOTOPICO_PK PRIMARY KEY(curso,topico),
    CONSTRAINT CURSO_CURSOTOPICO_FK FOREIGN KEY (curso) REFERENCES Curso(idCurso),
    CONSTRAINT TOPICO_CURSOTOPICO_FK FOREIGN KEY (topico) REFERENCES Topico(idTopico)

);

CREATE TABLE AvaliacaoFinal (

    cursoSincrono BIGINT,
    formando BIGINT,
    nota FLOAT NOT NULL,

    CONSTRAINT CHK_NOTA CHECK (nota >= 0 AND nota <= 20),
    CONSTRAINT CURSO_AVALIACAOFINAL_FK FOREIGN KEY (cursoSincrono) REFERENCES CursoSincrono(idCursoSincrono),
    CONSTRAINT FORMANDO_AVALIACAOFINAL_FK FOREIGN KEY (formando) REFERENCES Formando(idFormando)

);


CREATE TABLE AvaliacaoContinua (

        
    idAvaliacaoContinua BIGINT,
    cursoSincrono BIGINT,
    enunciado VARCHAR(300) NOT NULL,
    inicioDisponibilidade TIMESTAMP NOT NULL,
    fimDisponibilidade TIMESTAMP,
    inicioDeSubmissoes TIMESTAMP NOT NULL,
    fimDeSubmissoes TIMESTAMP,

    CONSTRAINT AVALIACAOCONTINUA_PK PRIMARY KEY(idAvaliacaoContinua,CursoSincrono),
    CONSTRAINT CURSOSINCRONO_AVALIACAOCONTINUA_FK FOREIGN KEY(cursoSincrono) REFERENCES cursoSincrono(idCursoSincrono),


);


CREATE TABLE Submissao (


    idSubmissao BIGINT GENERATED ALWAYS AS IDENTITY,
    avaliacaoContinua BIGINT,
    cursoSincrono BIGINT,
    formando BIGINT,
    submissao BIGINT,
    nota FLOAT,

    CONSTRAINT CHK_NOTA CHECK (nota >= 0 AND nota <= 20),
    CONSTRAINT SUBMISSAO_PK PRIMARY KEY(idSubmissao,avaliacaoContinua,CursoSincrono),
    CONSTRAINT AVALIACAOCONTINUA_SUBMISSAO_FK FOREIGN KEY (avaliacaoContinua,CursoSincrono) REFERENCES AvaliacaoContinua(IdAvaliacaoContinua,CursoSincrono),
    CONSTRAINT FORMANDO_SUBMISSAO_FK FOREIGN KEY (formando) REFERENCES Formando(idFormando),
    CONSTRAINT MATERIAL_AVALIACAOCONTINUA_FK FOREIGN KEY(submissao) REFERENCES Material(idMaterial)

);


CREATE TABLE Inscricao (

    curso BIGINT,
    formando BIGINT,
    registo DATE NOT NULL,


    CONSTRAINT INSCRICAO_PK PRIMARY KEY(curso,formando),
    CONSTRAINT CURSO_INSCRICAO_FK FOREIGN KEY (curso) REFERENCES Curso(idCurso),
    CONSTRAINT FORMANDO_INSCRICAO_FK FOREIGN KEY (formando) REFERENCES Formando(idFormando)

);


CREATE TABLE CanaisUtilizadores (

    canal BIGINT,
    utilizador BIGINT,


    CONSTRAINT CANAISUTILIZADORES_PK PRIMARY KEY(canal,utilizador),
    CONSTRAINT UTILIZADOR_CANAISUTILIZADORES_FK FOREIGN KEY (utilizador) REFERENCES Utilizadores(idUtilizador)

);

