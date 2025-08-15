const Sequelize = require('sequelize');
const { sendNotification, subscribeToCanal, unsubscribeFromCanal } = require('../utils.js');
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

controllers.listNotificacoes = async (req, res) => {

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
    const insertData = {
        canal: 1,
        titulo,
        conteudo
    };
    try {
        const createdRow = await models.historiconotificacoes.create(insertData);
        await sendNotification('canal_' + insertData.canal, titulo, conteudo);
        logger.info(`Notificação geral criada e enviada com sucesso. ID: ${createdRow.idnotificacao}`);
        return res.status(201).json(createdRow);
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
    const insertData = {
        canal: 2,
        titulo,
        conteudo
    };
    try {
        const createdRow = await models.historiconotificacoes.create(insertData);
        await sendNotification('canal_' + insertData.canal, titulo, conteudo);
        logger.info(`Notificação administrativa criada e enviada com sucesso. ID: ${createdRow.idnotificacao}`);
        return res.status(201).json(createdRow);
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
        const insertData = {
            canal,
            titulo,
            conteudo
        };
        const createdRow = await models.historiconotificacoes.create(insertData);
        await sendNotification('canal_' + insertData.canal, titulo, conteudo);
        logger.info(`Notificação de curso para o curso ${idcurso} criada e enviada com sucesso. ID: ${createdRow.idnotificacao}`);
        return res.status(201).json(createdRow);
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

    const { idutilizador } = req.params;
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

    if(idutilizador == undefined || idutilizador == null) idutilizador = req.user.idutilizador;

    try {
        const formando = await models.formando.findOne({
            where: {
                utilizador: idutilizador
            }
        });
        if (!formando) {
            logger.warn(`O utilizador ${idutilizador} não possui a role de formando.`);
            return res.status(404).json({
                error: 'Utilizador não tem o papel de formando.'
            });
        }
        const inscricoes = await models.inscricao.findAll({
            where: {
                formando: formando.idformando
            }
        });
        if (inscricoes.length === 0) {
            logger.info(`Nenhuma inscrição encontrada para o formando ${formando.idformando}.`);
            return res.status(200).json(canais);
        }
        const cursosIndexes = inscricoes.map(inscricao => inscricao.curso);
        const cursosCanais = await models.curso.findAll({
            attributes: ["canal"],
            where: {
                idcurso: {
                    [Sequelize.Op.in]: cursosIndexes
                }
            }
        });
        const canaisCursos = cursosCanais.map(curso => parseInt(curso.canal));
        canais = [...new Set([...canais, ...canaisCursos])];
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
      console.log(`canal_${canal}`);
      await unsubscribeFromCanal(device, `canal_${canal}`); 
    }

    logger.info(`Dispositivo desinscrito de todos os canais conhecidos: ${allCanalIds.join(', ')}`);

    const canaisDB = await models.canaisutilizadores.findAll({
      where: { utilizador: req.user.idutilizador }
    });

    const userCanais = canaisDB.map(c => parseInt(c.canal)).filter(Boolean);

    for (const canal of userCanais) {
      console.log(`canal_${canal}`);
      await subscribeToCanal(device, `canal_${canal}`); 
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




module.exports = controllers;
