var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const logger = require('../logger.js');

const controllers = {};

controllers.list = async (req, res) => {

    logger.debug(`Pedido para listar categorias.`);

    try {
        const data = await models.categoria.findAll();
        if (!data || data.length === 0) {
            logger.info(`Nenhuma categoria encontrada.`);
            return res.status(200).json([]);
        }
        logger.info(`Lista de categorias retornada com sucesso.`);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Erro interno do servidor ao listar categorias. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao listar as categorias.'
        });
    }
};

controllers.byID = async (req, res) => {
    const { id } = req.params;
    logger.debug(`Recebida requisição para buscar categoria por ID: ${id}`);
    try {
        const categoria = await models.categoria.findByPk(id);

        if (!categoria) {
            logger.info(`Categoria com ID ${id} não encontrada.`);
            return res.status(404).json({
                error: 'Categoria não encontrada.'
            });
        }

        logger.info(`Categoria com ID ${id} encontrada com sucesso.`);

        return res.status(200).json(categoria);
    } catch (error) {
        logger.error(`Erro interno do servidor ao buscar categoria por ID. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar a categoria.'
        });
    }
};

controllers.create = async (req, res) => {
    logger.debug(`Recebida requisição para criar uma nova categoria. Dados: ${JSON.stringify(req.body)}`);
    try {
        const { designacao } = req.body;

        if (!designacao) {
            logger.warn(`Tentativa de criar categoria sem a designação.`);
            return res.status(400).json({
                error: 'O campo "designacao" é obrigatório.'
            });
        }
        const newCategory = await models.categoria.create({
            designacao
        });
        logger.info(`Nova categoria criada com sucesso. ID: ${newCategory.idcategoria}`);
        return res.status(201).json(newCategory);
    } catch (error) {
        logger.error(`Erro ao criar nova categoria. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar a categoria.'
        });
    }
};

controllers.delete = async (req, res) => {
    const {
        id
    } = req.params;
    logger.debug(`Recebida requisição para deletar categoria com ID: ${id}`);
    try {
        const dependentAreas = await models.area.findAll({
            where: {
                categoria: id
            }
        });
        if (dependentAreas.length > 0) {
            logger.warn(`Tentativa de deletar categoria com ID ${id}, mas existem áreas dependentes.`);
            return res.status(409).json({
                error: 'Não é possível deletar a categoria, pois existem áreas associadas.',
                dependencies: dependentAreas
            });
        }
        const deletedRows = await models.categoria.destroy({
            where: {
                idcategoria: id
            }
        });
        if (deletedRows === 0) {
            logger.info(`Tentativa de deletar categoria com ID ${id} que não foi encontrada.`);
            return res.status(404).json({
                error: 'Categoria não encontrada.'
            });
        }
        logger.info(`Categoria com ID ${id} deletada com sucesso.`);
        return res.status(200).json({
            message: 'Categoria deletada com sucesso.'
        });
    } catch (error) {
        logger.error(`Erro interno do servidor ao deletar categoria. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao deletar a categoria.'
        });
    }
};

controllers.update = async (req, res) => {
    const {
        id
    } = req.params;
    logger.debug(`Recebida requisição para atualizar categoria com ID: ${id}. Dados: ${JSON.stringify(req.body)}`);
    try {
        const {
            designacao
        } = req.body;
        if (!designacao) {
            logger.warn(`Tentativa de atualizar categoria sem a designação. ID: ${id}`);
            return res.status(400).json({
                error: 'O campo "designacao" é obrigatório para a atualização.'
            });
        }
        const [affectedCount] = await models.categoria.update({
            designacao
        }, {
            where: {
                idcategoria: id
            }
        });
        if (affectedCount === 0) {
            logger.warn(`Tentativa de atualizar categoria com ID ${id} que não foi encontrada.`);
            return res.status(404).json({
                error: 'Categoria não encontrada ou nenhum dado foi alterado.'
            });
        }
        const updatedCategory = await models.categoria.findByPk(id);
        logger.info(`Categoria com ID ${id} atualizada com sucesso.`);
        return res.status(200).json(updatedCategory);
    } catch (error) {
        logger.error(`Erro interno do servidor ao atualizar categoria. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao atualizar a categoria.'
        });
    }
};

controllers.listAreas = async (req, res) => {
    const {
        id
    } = req.params;
    logger.debug(`Recebida requisição para listar áreas da categoria com ID: ${id}`);
    try {
        const areas = await models.area.findAll({
            where: {
                categoria: id
            }
        });
        if (areas.length === 0) {
            logger.info(`Nenhuma área encontrada para a categoria com ID ${id}.`);
            return res.status(200).json([]);
        }
        logger.info(`Lista de áreas para a categoria com ID ${id} retornada com sucesso.`);
        return res.status(200).json(areas);
    } catch (error) {
        logger.error(`Erro interno do servidor ao listar áreas da categoria. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar as áreas.'
        });
    }
};


module.exports = controllers;
