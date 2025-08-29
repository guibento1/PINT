var initModels = require("../models/init-models.js");
var db = require("../database.js");
const logger = require('../logger.js');
var models = initModels(db);


async function getUserInfo(user) {

    var roles = [];

    const admin =
      user.roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;

    const formando =
      user.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;
    const formador =
      user.roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;


    const utilizadorObject = await models.utilizadores.findByPk(user.idutilizador,{
        attributes: ["nome"]
    });

    if (admin) roles.push("admin");
    if (formando) roles.push("formando");
    if (formador) roles.push("formador");

    return {id : user.idutilizador, roles: roles, nome: utilizadorObject.nome };
}


const controllers = {};

controllers.createPost = async (req, res) => {

  const { idtopico } = req.params;
  const { titulo, conteudo } = req.body;
  const utilizador = req.user.idutilizador;


  logger.debug(
    `Recebida requisição para criar post. Query: ${JSON.stringify(
      req.query
    )}`
  );

  if( titulo == undefined || titulo == null ){
    return res.status(400).json({message : "Campo obrigatório :  titulo"})
  }

  if( conteudo == undefined || conteudo == null ){
    return res.status(400).json({message : "Campo obrigatório : conteudo"})
  }

  try {

      const post = await models.post.create(

            {
                utilizador,
                topico : idtopico,
                titulo,
                conteudo
            },

            { returning: true }

      );

      post.dataValues.utilizador = await getUserInfo(req.user);

      return res.status(200).json(post);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o post.",
    });

  }

};


controllers.getPost = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;

  logger.debug(
    `Recebida requisição para obter post. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const post = await models.post.findByPk(id);

      post.dataValues.utilizador = await getUserInfo(req.user);

      return res.status(200).json(post);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao obter post.",
    });

  }

};


controllers.votePost = async (req, res, positiva) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;

  logger.debug(
    `Recebida requisição para dar voto a um post. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      await models.iteracaopost.upsert(

            {
                post: id,
                utilizador,
                positiva
            },

      );

      return res.status(200).json({ message:"Post votado com sucesso" });
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno no voto a um post.",
    });

  }

};


controllers.removeVotePost = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;

  logger.debug(
    `Recebida requisição para remover voto a um post. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      await models.iteracaopost.destroy(

            {
                where :
                {
                    post: id,
                    utilizador
                }
            }

      );

      return res.status(200).json({ message:"Post desvotado com sucesso" });
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });
return res.status(500).json({
      error: "Ocorreu um erro interno ao remover o voto a um post.",
    });

  }

};


controllers.respondPost = async (req, res) => {

  const { id } = req.params;
  const { conteudo } = req.body;
  const utilizador = req.user.idutilizador;


  logger.debug(
    `Recebida requisição para criar comentario para o post com id ${id}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const comentarioObject = await models.comentario.create(

            {
                utilizador,
                conteudo
            },

            { returning: true }

      );

        
      const comentarioPost = await models.respostapost.create(
        {
        post : id,  
          idcomentario: comentarioObject.idcomentario 
        },
        { returning: true }
      );

      if(!comentarioPost){
        comentarioObject.destroy();
        throw new Error("Comentário não inserido na tabela respostaPost");
      }

      return res.status(200).json(comentarioObject);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar comentário.",
    });

  }

};


controllers.respondComent = async (req, res) => {

  const { id } = req.params;
  const { conteudo } = req.body;
  const utilizador = req.user.idutilizador;


  logger.debug(
    `Recebida requisição para criar comentario para o post com id ${id}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const comentarioObject = await models.comentario.create(

            {
                utilizador,
                conteudo
            },

            { returning: true }

      );

        
      const respostaComentario = await models.respostacomentario.create(
        {
          comentario : id,  
          idcomentario: comentarioObject.idcomentario 
        },
        { returning: true }
      );

      if(!respostaComentario){
        comentarioObject.destroy();
        throw new Error("Comentário não inserido na tabela respostaPost");
      }

      return res.status(200).json(comentarioObject);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar comentário.",
    });

  }

};


controllers.voteComentario = async (req, res, positiva) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;

  logger.debug(
    `Recebida requisição para dar voto a um comentario. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      await models.iteracaocomentario.upsert(

            {
                comentario: id,
                utilizador,
                positiva
            },

      );

      return res.status(200).json({ message:"Comentario votado com sucesso" });
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno no voto a um comentario.",
    });

  }

};


controllers.removeVoteComentario = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;

  logger.debug(
    `Recebida requisição para remover voto a um comentario. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      await models.iteracaocomentario.destroy(

            {
                where :
                {
                    comentario: id,
                    utilizador
                }
            }

      );

      return res.status(200).json({ message:"Comentario desvotado com sucesso" });
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });
    
    return res.status(500).json({
        error: "Ocorreu um erro interno ao remover o voto a um comentario.",
    });

  }

};




module.exports = controllers;
