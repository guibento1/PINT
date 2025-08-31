var initModels = require("../models/init-models.js");
const Sequelize = require("sequelize");
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

    return {id : user.idutilizador, nome: utilizadorObject.nome };
}


async function formatStuff(stuff,utilizador, iteracaoModel) {

  return await Promise.all(
    stuff.map(async (stuffObject) => {

      if(stuffObject.utilizador == utilizador) {
        stuffObject.dataValues.utilizador = "eu"; 
      } else {

        const utilizadorObject = await models.utilizadores.findByPk(stuffObject.utilizador,{
          attributes: ["nome"]
        });

        stuffObject.dataValues.utilizador = {id : utilizadorObject.idutilizador, nome: utilizadorObject.nome };  
      }

      const queryOptions = { where : {utilizador} };

      if(stuffObject.idpost != undefined){

        queryOptions.where.post = stuffObject.idpost;

      } else {


        queryOptions.where.comentario = stuffObject.idcomentario;


      }

      


      let iteracao  = await iteracaoModel.findOne(queryOptions);
      iteracao = !iteracao ? null : iteracao.positiva ? true : false; 

      stuffObject.dataValues.iteracao = iteracao;

      return stuffObject;
    })
  );

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


controllers.deletePost = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;


  const admin =
    req.user.roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;


  logger.debug(
    `Recebida requisição para eleminar post. Query: ${JSON.stringify(
      req.query
    )}`
  );


  try {

      const post = await models.post.findByPk(id);

      if(!post){

        return res.status(404).json({
          error: "Post não encontrado.",
        });

      }

      if(admin || utilizador == post.utilizador) {

        await post.destroy();
        return res.status(200).json({message : "Post eleminado com sucesso"});

      }


      return res.status(403).json({
        error: "Proibido: permissões insuficientes.",
      });
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao eleminar o post.",
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

      let iteracao  = await models.iteracaopost.findOne({where : {post:id,utilizador}});
      iteracao = !iteracao ? null : iteracao.positiva ? true : false; 

      post.dataValues.iteracao = iteracao;

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


controllers.getPosts = async (req, res, topico = null) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;
  const orderBy = req.query.order;

  logger.debug(
    `Recebida requisição para obter post. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {


      const queryOptions = {};

      if(orderBy == "recent"){
        queryOptions.order = [['criado', 'DESC']];
      } else {
        queryOptions.order = [['pontuacao', 'DESC']];
      }

      if(topico != null){
        queryOptions.where = { topico : topico } ;
      }

      let posts = await models.post.findAll(queryOptions);
      if(posts.length > 0){
        posts = await formatStuff(posts,utilizador,models.iteracaopost);
      }

      return res.status(200).json(posts);
        
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


controllers.reportPost = async (req, res) => {

  const { id } = req.params;
  const { tipo, descricao } = req.body;
  const utilizador = req.user.idutilizador;


  logger.debug(
    `Recebida requisição para criar denuncia para o post com id ${id}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const denunciaObject = await models.denuncia.create(

            {
              tipo, 
              descricao,
              criador : utilizador
            },

            { returning: true }
      );

        
      const denunciaPost = await models.denunciapost.create(
        {
          post : id,  
          denuncia: denunciaObject.iddenuncia 
        },
        { returning: true }
      );

      if(!denunciaPost){
        denunciaObject.destroy();
        throw new Error("Denuncia não inserida na tabela DenunciaPost");
      }

      return res.status(200).json(denunciaObject);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar denuncia.",
    });

  }

};


controllers.getRespostasPost = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;
  const orderBy = req.query.order;


  logger.debug(
    `Recebida requisição para criar comentario para o post com id ${id}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const repostasObjects = await models.respostapost.findAll( {where : { post : id  }, attributes : ["idcomentario"] });
      const respostasIds = repostasObjects.map((resposta) => resposta.idcomentario );

      const queryOptions = {
        where : { 
          idcomentario : {
            [Sequelize.Op.in]: respostasIds
          }
        }
      };

      if(orderBy == "recent"){
        queryOptions.order = [['criado', 'DESC']];
      } else {
        queryOptions.order = [['pontuacao', 'DESC']];
      }

      let comentarios = await models.comentario.findAll(queryOptions);

      if(comentarios.length > 0){
        comentarios = await formatStuff(comentarios,utilizador,models.iteracaocomentario);
      }

      return res.status(200).json(comentarios);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao obter comentário.",
    });

  }

};


controllers.getRespostasComentario = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;
  const orderBy = req.query.order;


  logger.debug(
    `Recebida requisição para criar comentario para o comentario com id ${id}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const repostasObjects = await models.respostacomentario.findAll( {where : { comentario : id  }, attributes : ["idcomentario"] });
      const respostasIds = repostasObjects.map((resposta) => resposta.idcomentario );

      const queryOptions = {
        where : { 
          idcomentario : {
            [Sequelize.Op.in]: respostasIds
          }
        }
      };

      if(orderBy == "recent"){
        queryOptions.order = [['criado', 'DESC']];
      } else {
        queryOptions.order = [['pontuacao', 'DESC']];
      }

      let comentarios = await models.comentario.findAll(queryOptions);

      if(comentarios.length > 0){
        comentarios = await formatStuff(comentarios,utilizador,models.iteracaocomentario);
      }

      return res.status(200).json(comentarios);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao obter comentário.",
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


controllers.getComentario = async (req, res) => {

  const { id } = req.params;

  logger.debug(
    `Recebida requisição para obter comentario. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const comentario = await models.comentario.findByPk(id);

      if(comentario){

        let context = await models.respostapost.findOne({where : { idcomentario : id } });

        if(!context){

          comentario.dataValues.alvo = "comentario";
          context = await models.respostacomentario.findOne({where : { idcomentario : id } });

          comentario.dataValues.idalvo = context.comentario;
        } else {

          comentario.dataValues.alvo = "post";
          comentario.dataValues.idalvo = context.post;

        }

      }

      return res.status(200).json(comentario);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao obter comentario.",
    });

  }

};


controllers.reportComentario = async (req, res) => {

  const { id } = req.params;
  const { tipo, descricao } = req.body;
  const utilizador = req.user.idutilizador;


  logger.debug(
    `Recebida requisição para criar denuncia para o comentario com id ${id}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const denunciaObject = await models.denuncia.create(

            {
              tipo, 
              descricao,
              criador : utilizador
            },

            { returning: true }
      );

        
      const denunciaPost = await models.denunciacomentario.create(
        {
          comentario : id,  
          denuncia : denunciaObject.iddenuncia 
        },
        { returning: true }
      );

      if(!denunciaPost){
        denunciaObject.destroy();
        throw new Error("Denuncia não inserida na tabela DenunciaComentario");
      }

      return res.status(200).json(denunciaObject);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar denuncia.",
    });

  }

};


controllers.deleteComentario = async (req, res) => {

  const { id } = req.params;
  const utilizador = req.user.idutilizador;


  const admin =
    req.user.roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;


  logger.debug(
    `Recebida requisição para eleminar post. Query: ${JSON.stringify(
      req.query
    )}`
  );


  try {

      const comentario = await models.comentario.findByPk(id);

      if(!comentario){

        return res.status(404).json({
          error: "Post não encontrado.",
        });

      }

      if(admin || utilizador == comentario.utilizador) {

        await  comentario.destroy();
        return res.status(200).json({message : "Comentario eleminado com sucesso"});

      }


      return res.status(403).json({
        error: "Proibido: permissões insuficientes.",
      });
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao eleminar o post.",
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


controllers.getTiposDenuncia = async (req, res) => {

  logger.debug(
    `Recebida requisição para obter tipos de denuncia. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      const tiposDenuncia = await models.tipodenuncia.findAll();


      return res.status(200).json(tiposDenuncia);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao tipos de denuncia.",
    });

  }

};


controllers.getDenunciaPosts = async (req, res) => {

  logger.debug(
    `Recebida requisição para obter tipos de denuncia. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      queryOptions = {

          include: [
            {
              model: models.denuncia,
              as: "denuncia_denuncium",
              attributes: ["tipo", "descricao", "criador"],
            },
          ]

      }


      const denunciaPosts = await models.denunciapost.findAll(queryOptions);


      let denunciaPostResults = 

        await Promise.all( denunciaPosts.map( async (denuncia) => {

          const utilizadorObject = await models.utilizadores.findByPk(denuncia.denuncia_denuncium.criador,{
              attributes: ["nome"]
          });

            return {
              post: denuncia.post,
              iddenuncia: denuncia.denuncia,
              tipo: denuncia.denuncia_denuncium.tipo,
              decricao: denuncia.denuncia_denuncium.descricao,
              utilizador: { id : denuncia.denuncia_denuncium.criador, nome : utilizadorObject.nome }
            };
          })
        );


      return res.status(200).json(denunciaPostResults);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao obter denuncias.",
    });

  }

};


controllers.getDenunciaComentarios = async (req, res) => {

  logger.debug(
    `Recebida requisição para obter tipos de denuncia. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      queryOptions = {

          include: [
            {
              model: models.denuncia,
              as: "denuncia_denuncium",
              attributes: ["tipo", "descricao", "criador"],
            },
          ]

      }


      const denunciaComentarios = await models.denunciacomentario.findAll(queryOptions);

      let denunciaComentarioResults = 

        await Promise.all( denunciaComentarios.map( async (denuncia) => {

          const utilizadorObject = await models.utilizadores.findByPk(denuncia.denuncia_denuncium.criador,{
              attributes: ["nome"]
          });

            return {
              comentario: denuncia.comentario,
              iddenuncia: denuncia.denuncia,
              tipo: denuncia.denuncia_denuncium.tipo,
              decricao: denuncia.denuncia_denuncium.descricao,
              utilizador: { id : denuncia.denuncia_denuncium.criador, nome : utilizadorObject.nome }
            };
          })
        );

      return res.status(200).json(denunciaComentarioResults);
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao obter denuncias.",
    });

  }

};


controllers.rmDenuncia = async (req, res) => {


  const { id } = req.params;

  logger.debug(
    `Recebida requisição para eleminar denuncia. Query: ${JSON.stringify(
      req.query
    )}`
  );

  try {

      await models.denuncia.destroy({ where : { iddenuncia : id } });


      return res.status(200).json({message : "denuncia eleminada com sucesso"});
        
  } catch (error) {

    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao eleminar denuncia.",
    });

  }

};




module.exports = controllers;
