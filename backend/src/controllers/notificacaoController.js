const Sequelize = require('sequelize');
const { sendNotification, sendNotificationToUtilizador, subscribeToCanal, unsubscribeFromCanal } = require('../utils.js');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const logger = require('../logger.js');

const controllers = {};

controllers.listCanais = async (req, res) => {

    logger.debug(`Pedido para listar canais de notificação.`);
    try {
        const data = await models.canalnotificacoes.findAll();
        if (!data || data.length === 0) {
            logger.info(`Nenhum canal de notificação encontrado.`);
            return res.status(200).json([]);
        }
        logger.info(`Lista de canais de notificação retornada com sucesso.`);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Erro interno do servidor ao listar canais de notificação. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao listar os canais de notificação.'
        });
    }
};

controllers.listNotificacoesByCanal = async (req, res) => {

    const { idCanal } = req.params;
    logger.debug(`Recebida requisição para listar notificações do canal com ID: ${idCanal}`);
    try {
        const data = await models.historiconotificacoes.findAll({
            where: {
                canal: idCanal
            }
        });
        if (!data || data.length === 0) {
            logger.info(`Nenhuma notificação encontrada para o canal com ID ${idCanal}.`);
            return res.status(200).json([]);
        }
        logger.info(`Lista de notificações do canal ${idCanal} retornada com sucesso.`);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Erro interno do servidor ao buscar notificações. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar as notificações.'
        });
    }
};

controllers.criarNotificacaoGeral = async (req, res) => {

    logger.debug(`Recebida requisição para criar notificação geral. Dados: ${JSON.stringify(req.body)}`);
    const { titulo, conteudo } = req.body;
    if (!titulo || !conteudo) {
        logger.warn(`Tentativa de criar notificação geral sem título ou conteúdo. Dados recebidos: ${JSON.stringify(req.body)}`);
        return res.status(400).json({
            error: 'Os campos "titulo" e "conteudo" são obrigatórios.'
        });
    }
    try {
        await sendNotification(1, titulo, conteudo);
        logger.info(`Notificação administrativa criada e enviada com sucesso.`);
        return res.status(201).json({sucess : true, message: "notificacao enviada com sucesso"});
    } catch (error) {
        logger.error(`Erro ao criar e enviar notificação geral. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar ou enviar a notificação.'
        });
    }
};

controllers.criarNotificacaoAdministrativa = async (req, res) => {

    logger.debug(`Recebida requisição para criar notificação administrativa. Dados: ${JSON.stringify(req.body)}`);
    const { titulo, conteudo } = req.body;
    if (!titulo || !conteudo) {
        logger.warn(`Tentativa de criar notificação administrativa sem título ou conteúdo. Dados recebidos: ${JSON.stringify(req.body)}`);
        return res.status(400).json({
            error: 'Os campos "titulo" e "conteudo" são obrigatórios.'
        });
    }
    try {
        await sendNotification(2, titulo, conteudo);
        logger.info(`Notificação administrativa criada e enviada com sucesso.`);
        return res.status(201).json({sucess : true, message: "notificacao enviada com sucesso"});
    } catch (error) {
        logger.error(`Erro ao criar e enviar notificação administrativa. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar ou enviar a notificação.'
        });
    }
};

controllers.criarNotificacaoCurso = async (req, res) => {

    logger.debug(`Recebida requisição para criar notificação de curso. Dados: ${JSON.stringify(req.body)}`);
    const { idcurso, titulo, conteudo } = req.body;
    if (!idcurso || !titulo || !conteudo) {
        logger.warn(`Tentativa de criar notificação de curso com campos faltando. Dados recebidos: ${JSON.stringify(req.body)}`);
        return res.status(400).json({
            error: 'Os campos "idcurso", "titulo" e "conteudo" são obrigatórios.'
        });
    }
    try {
        const curso = await models.curso.findOne({
            where: {
                idcurso: idcurso
            }
        });
        if (!curso) {
            logger.warn(`Curso com ID ${idcurso} não encontrado.`);
            return res.status(404).json({
                error: 'Curso não encontrado.'
            });
        }
        const canal = curso.canal;
        await sendNotification(canal, titulo, conteudo);
        logger.info(`Notificação de curso para o curso ${idcurso} criada e enviada com sucesso.`);
        return res.status(201).json({sucess : true, message: "notificacao enviada com sucesso"});
    } catch (error) {
        logger.error(`Erro ao criar e enviar notificação de curso. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar ou enviar a notificação.'
        });
    }
};


controllers.criarNotificacaoUtilizador = async (req, res) => {


    const { idutilizador } = req.params;
    const { titulo, conteudo } = req.body;

    logger.debug(`Recebida requisição para criar para notificacao para utilizador. Dados: ${JSON.stringify(req.body)}`);


    if (!titulo || !conteudo) {
        logger.warn(`Tentativa de criar notificação de curso com campos faltando. Dados recebidos: ${JSON.stringify(req.body)}`);
        return res.status(400).json({
            error: 'Os campos "titulo" e "conteudo" são obrigatórios.'
        });
    }

    try {

        await sendNotificationToUtilizador(idutilizador, titulo, conteudo);
        logger.info(`Notificação de curso para o utilizador ${idutilizador} criada e enviada com sucesso.`);
        return res.status(201).json({sucess : true, message: "notificacao enviada com sucesso"});
        
    } catch (error) {

        logger.error(`Erro ao criar e enviar notificação de curso. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar ou enviar a notificação.'
        });
        
    }

};

controllers.getCanaisInscritos = async (req, res) => {

    var { idutilizador } = req.params;
    logger.debug(`Recebida requisição para buscar canais inscritos para o utilizador ${idutilizador}`);
    if (req.user.idutilizador != idutilizador && !(req.user.roles && req.user.roles.map(roleEntry => roleEntry.role).includes("admin"))) {
        logger.warn(`Tentativa de acesso não autorizado aos canais inscritos do utilizador ${idutilizador} pelo utilizador ${req.user.idutilizador}`);
        return res.status(403).json({
            error: 'Proibido: permissões insuficientes.'
        });
    }
    let canais = [1];

    if (
        req.user.idutilizador == idutilizador && 
        req.user.roles && 
        req.user.roles.map(roleEntry => roleEntry.role).includes("admin")
       ) {
       canais.push(2);
    } else {
      const isAdmin = await models.admin.count({ where: { utilizador: idutilizador, ativo: true }, limit: 1 });
      if(isAdmin) canais.push(2);
    }


    try {


        const formando = await models.formando.findOne({
            where: {
                utilizador: idutilizador
            }
        });

        if(formando){

            const formandoId = formando.idformando;

            const inscricoes = await models.inscricao.findAll({
                where: {
                    formando: formandoId
                },
                include: [
                 {
                    model: models.curso,
                    as: "curso_curso",
                    attributes: ["canal"],
                 },
                ]
            });

            const inscricoesCanais = inscricoes.map((inscricao) => parseInt(inscricao.curso_curso.canal) )
            canais.push(...inscricoesCanais);

        }
        logger.info(`Canais inscritos para o utilizador ${idutilizador} retornados com sucesso.`);
        return res.status(200).json(canais);
    } catch (error) {
        logger.error(`Erro interno do servidor ao buscar canais inscritos. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar os canais inscritos.'
        });
    }
};


controllers.listUserNotifications = async (req, res) => {

    var idutilizador = req.user.idutilizador;


    logger.debug(`Recebida requisição para buscar notificaoes para o utilizador ${idutilizador}`);

    let canais = [1];

    if (
        req.user.roles && 
        req.user.roles.map(roleEntry => roleEntry.role).includes("admin")
       ) {
       canais.push(2);
    } else {
      const isAdmin = await models.admin.count({ where: { utilizador: idutilizador, ativo: true }, limit: 1 });
      if(isAdmin) canais.push(2);
    }


    const formandoId =
        req.user.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;

    if(formandoId){

        const inscricoes = await models.inscricao.findAll({
            where: {
                formando: formandoId
            },
            include: [
             {
                model: models.curso,
                as: "curso_curso",
                attributes: ["canal"],
             },
            ]
        });

        const inscricoesCanais = inscricoes.map((inscricao) => parseInt(inscricao.curso_curso.canal) )

        canais.push(...inscricoesCanais);

    }


    logger.debug(`Canais subscritos pelo utilizador: ${canais}`);

    try {

        let notificacoes = [];

        const notificacoesGerais = await models.historiconotificacoes.findAll({

            where : {

                canal : {
                 [Sequelize.Op.in]: canais
                }
            },

            order: [
                ['instante','DESC']
            ],

            limit : 10
        })

        notificacoes.push(...notificacoesGerais);


        const notificacoesPrivadas = await models.historiconotificacoesprivadas.findAll({

            where : {
                utilizador : idutilizador
            },

            order: [
                ['instante','DESC']
            ],

            limit : 10
        })


        notificacoes.push(...notificacoesPrivadas);

        notificacoes.sort((a, b) => new Date(b.instante) - new Date(a.instante));

        logger.info(`Notificacoes encontradas com sucesso`);
        return res.status(200).json(notificacoes);
        
    } catch (error) {

        logger.error(`Erro ao ir buscar notificacoes do utilizador. Detalhes: ${error.message}`, {
          stack: error.stack
        });
        return res.status(500).json({
          error: 'Erro ao ir buscar notificacoes do utilizador.'
        });
        
    }

};


controllers.subscribeDeviceToCanais = async (req, res) => {

  const { device } = req.body;

  logger.debug(`Recebida requisição para inscrição automática do dispositivo nos canais. Token: ${device}`);

  if (!device || typeof device !== 'string') {
    logger.warn(`Token de dispositivo inválido ou ausente na requisição.`);
    return res.status(400).json({
      error: 'Campo "device" (string) é obrigatório.'
    });
  }

  try {

    const allCanais = await models.canaisutilizadores.findAll({
      attributes: ['canal'],
      group: ['canal']
    });

    const allCanalIds = allCanais.map(c => parseInt(c.canal)).filter(Boolean);

    for (const canal of allCanalIds) {
      await unsubscribeFromCanal(device, canal); 
    }

    logger.info(`Dispositivo desinscrito de todos os canais conhecidos: ${allCanalIds.join(', ')}`);

    const canaisDB = await models.canaisutilizadores.findAll({
      where: { utilizador: req.user.idutilizador }
    });

    const userCanais = canaisDB.map(c => parseInt(c.canal)).filter(Boolean);

    for (const canal of userCanais) {
      await subscribeToCanal(device, canal); 
    }

    logger.info(`Dispositivo inscrito com sucesso nos canais do utilizador: ${userCanais.join(', ')}`);
    return res.status(200).json({
      success: true,
      message: 'Dispositivo desinscrito de canais antigos e inscrito nos canais do utilizador.',
      canais: userCanais
    });

  } catch (error) {
    logger.error(`Erro ao processar inscrição do dispositivo. Detalhes: ${error.message}`, {
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Erro interno ao processar a inscrição do dispositivo.'
    });
  }
};


controllers.registerDevice = async (req, res) => {

  const { device } = req.body;
  const utilizador = req.user.idutilizador;

  logger.debug(`Recebida requisição para registo do dispositivo. Token: ${device}`);

  if (!device || typeof device !== 'string') {
    logger.warn(`Token de dispositivo inválido ou ausente na requisição.`);
    return res.status(400).json({
      error: 'Campo "device" (string) é obrigatório.'
    });
  }

  try {

    await models.utilizadordispositivos.upsert({
            utilizador,
            dispositivo : device
    });


    logger.info(`Dispositivo registado`);


    return res.status(200).json({
      success: true,
      message: 'Dispositivo registado com sucesso.',
    });

  } catch (error) {
    logger.error(`Erro ao processar registo do dispositivo. Detalhes: ${error.message}`, {
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Erro interno ao processar registo do dispositivo.'
    });
  }
};




module.exports = controllers;
