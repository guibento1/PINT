var initModels = require("../models/init-models.js");
var db = require("../database.js");
const logger = require('../logger.js');
var models = initModels(db);

const controllers = {};

controllers.list = async (req, res) => {

    logger.debug(`Pedido para listar áreas.`);

    try {
        const data = await models.area.findAll();

        if (data === null || data.length === 0) {
            logger.info(`Nenhuma área encontrada.`);
            return res.status(200).json([]);
        }

        logger.info(`Lista de áreas retornada com sucesso.`);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Erro interno no servidor ao listar áreas. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao listar as áreas.'
        });
    }
};


controllers.byID = async (req, res) => {

    const { id } = req.params;

    logger.debug(`Recebida requisição para buscar área por ID: ${id}`);
    try {
        const area = await models.area.findByPk(id);
        if (!area) {
            logger.info(`Área com ID ${id} não encontrada.`);
            return res.status(404).json({
                error: 'Área não encontrada.'
            });
        }
        logger.info(`Área com ID ${id} encontrada com sucesso.`);
        return res.status(200).json(area);
    } catch (error) {
        logger.error(`Erro interno do servidor ao buscar área por ID. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar a área.'
        });
    }
};


controllers.create = async (req, res) => {

    logger.debug(`Recebida requisição para criar uma nova área. Dados: ${JSON.stringify(req.body)}`);

    try {
        const { designacao, categoria } = req.body;

        if (!designacao || !categoria) {

            logger.warn(`Tentativa de criar área com campos faltando. Dados recebidos: ${JSON.stringify(req.body)}`);
            return res.status(400).json({
                error: 'Os campos "designacao" e "categoria" são obrigatórios.'
            });
        }

        const newArea = await models.area.create({
            designacao,
            categoria
        });

        logger.info(`Nova área criada com sucesso. ID: ${newArea.id}`);

        return res.status(201).json(newArea);

    } catch (error) {

        logger.error(`Erro ao criar nova área. Detalhes: ${error.message}`, {
            stack: error.stack
        });

        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar a área.'
        });
    }
};


controllers.delete = async (req, res) => {

    const { id } = req.params;

    logger.debug(`Recebida requisição para deletar área com ID: ${id}`);
    try {
        const dependentTopics = await models.topicoarea.findAll({
            where: {
                area: id
            },
            include: [{
                model: models.topico,
                as: 'topico_topico',
                attributes: ['idtopico', 'designacao'],
            }],
        });
        if (dependentTopics.length > 0) {
            logger.warn(`Tentativa de deletar área com ID ${id}, mas existem tópicos dependentes.`);
            return res.status(409).json({
                error: 'Não é possível deletar a área, pois existem tópicos associados.',
                dependencies: dependentTopics.map(dep => ({
                    idtopico: dep.topico_topico.idtopico,
                    designacao: dep.topico_topico.designacao
                }))
            });
        }
        const deletedRows = await models.area.destroy({
            where: {
                idarea: id
            }
        });
        if (deletedRows === 0) {
            logger.info(`Tentativa de deletar área com ID ${id} que não foi encontrada.`);
            return res.status(404).json({
                error: 'Área não encontrada.'
            });
        }
        logger.info(`Área com ID ${id} deletada com sucesso.`);
        return res.status(200).json({
            message: 'Área deletada com sucesso.'
        });
    } catch (error) {
        logger.error(`Erro interno do servidor ao deletar área. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao deletar a área.'
        });
    }
};


controllers.update = async (req, res) => {

    const { id } = req.params;
    logger.debug(`Recebida requisição para atualizar área com ID: ${id}. Dados: ${JSON.stringify(req.body)}`);

    try {
        const {
            designacao,
            categoria
        } = req.body;

        const updatedData = {};

        if (designacao) updatedData.designacao = designacao;
        if (categoria) updatedData.categoria = categoria;

        if (Object.keys(updatedData).length === 0) {
            logger.warn(`Tentativa de atualização da área com ID ${id} sem dados fornecidos.`);
            return res.status(400).json({
                error: 'Nenhum campo fornecido para atualização.'
            });
        }

        const [affectedCount] = await models.area.update(updatedData, {
            where: {
                idarea: id
            }
        });
        if (affectedCount === 0) {
            logger.warn(`Tentativa de atualizar área com ID ${id} que não foi encontrada.`);
            return res.status(404).json({
                error: 'Área não encontrada ou nenhum dado foi alterado.'
            });
        }
        const updatedArea = await models.area.findByPk(id);
        logger.info(`Área com ID ${id} atualizada com sucesso.`);
        return res.status(200).json(updatedArea);
    } catch (error) {
        logger.error(`Erro interno do servidor ao atualizar área. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao atualizar a área.'
        });
    }
};

controllers.listTopicos = async (req, res) => {
    const { id } = req.params;
    logger.debug(`Recebida requisição para listar tópicos da área com ID: ${id}`);

    try {
        const dependentTopics = await models.topicoarea.findAll({
            where: {
                area: id
            },
            include: [{
                model: models.topico,
                as: 'topico_topico',
                attributes: ['idtopico', 'designacao'],
            }],
        });

        if (dependentTopics.length === 0) {
            logger.info(`Nenhum tópico encontrado para a área com ID ${id}.`);
            return res.status(200).json([]);
        }
        const topics = dependentTopics.map(dep => ({
            idtopico: dep.topico_topico.idtopico,
            designacao: dep.topico_topico.designacao
        }));

        logger.info(`Lista de tópicos para a área com ID ${id} retornada com sucesso.`);
        return res.status(200).json(topics);
    } catch (error) {

        logger.error(`Erro interno do servidor ao listar tópicos da área. Detalhes: ${error.message}`, {
            stack: error.stack
        });

        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar os tópicos.'
        });
    }
};


module.exports = controllers;
