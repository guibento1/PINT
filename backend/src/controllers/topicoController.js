const Sequelize = require('sequelize');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const logger = require('../logger.js');

const controllers = {};


async function findAreas(id) {

    let data = await models.topicoarea.findAll({ 
        where: { topico: id }
        ,include: [{
            model: models.area,
            as: 'area_area', 
            attributes: ['idarea', 'designacao', 'categoria'],
        }],
    });


    data = data.map(a => ({
        idarea: a.area_area.idarea, 
        designacao: a.area_area.designacao,
        categoria: a.area_area.categoria
    })) 


    return data;

}


async function updateAreas(id, areas) {

    try {

        let topicoAreasInserts = [];
        let existingAreas = await findAreas(id);
        existingAreas = existingAreas.map(eArea => eArea.idarea);

        const areasToDelete = existingAreas.filter(area => !areas.includes(area));
        const areasToInsert = areas.filter(area => !existingAreas.includes(area));

        await models.topicoarea.destroy({
            where: {
                area: {
                    [Sequelize.Op.in] : areasToDelete
                }
            }
        });

        for (const area of areasToInsert) {
            topicoAreasInserts.push({ topico: id, area: area });
        }

        await models.topicoarea.bulkCreate(topicoAreasInserts);

    } catch (error) {
    }
}

controllers.list = async (req, res) => {
    logger.debug(`Pedido para listar tópicos.`);
    try {
        const data = await models.topico.findAll();
        if (!data || data.length === 0) {
            logger.info(`Nenhum tópico encontrado.`);
            return res.status(200).json([]);
        }
        const topicsWithAreas = await Promise.all(data.map(async (topico) => {
            const areas = await findAreas(topico.idtopico);
            return {
                ...topico.dataValues,
                areas
            };
        }));
        logger.info(`Lista de tópicos retornada com sucesso.`);
        return res.status(200).json(topicsWithAreas);
    } catch (error) {
        logger.error(`Erro interno do servidor ao listar tópicos. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao listar os tópicos.'
        });
    }
};

controllers.byID = async (req, res) => {

    const { id } = req.params;
    logger.debug(`Recebida requisição para buscar tópico por ID: ${id}`);
    try {
        const topico = await models.topico.findByPk(id);
        if (!topico) {
            logger.info(`Tópico com ID ${id} não encontrado.`);
            return res.status(404).json({
                error: 'Tópico não encontrado.'
            });
        }
        const areas = await findAreas(id);
        topico.dataValues.areas = areas;
        logger.info(`Tópico com ID ${id} encontrado com sucesso.`);
        return res.status(200).json(topico);
    } catch (error) {
        logger.error(`Erro interno do servidor ao buscar tópico por ID. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar o tópico.'
        });
    }
};

controllers.create = async (req, res) => {
    logger.debug(`Recebida requisição para criar um novo tópico. Dados: ${JSON.stringify(req.body)}`);
    try {

        const { designacao, areas } = req.body;

        if (!designacao || !areas || areas.length === 0) {
            logger.warn(`Tentativa de criar tópico com campos faltando.`);
            return res.status(400).json({
                error: 'O campo "designacao" e pelo menos uma "area" são obrigatórios.'
            });
        }
        const newTopic = await models.topico.create({
            designacao
        });
        const topicAreasInserts = areas.map(areaId => ({
            topico: newTopic.idtopico,
            area: areaId
        }));
        await models.topicoarea.bulkCreate(topicAreasInserts);
        const associatedAreas = await findAreas(newTopic.idtopico);
        newTopic.dataValues.areas = associatedAreas;
        logger.info(`Novo tópico criado com sucesso. ID: ${newTopic.idtopico}`);
        return res.status(201).json(newTopic);
    } catch (error) {
        logger.error(`Erro ao criar novo tópico. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao criar o tópico.'
        });
    }
};


controllers.getNobjetos = async (req, res) => {

    const { id } = req.params;

    logger.debug(`Recebida requisição para contar objetos do tópico com ID: ${id}`);
    try {
        const nEntriesCursos = await models.cursotopico.count({
            where: {
                topico: id
            }
        });
        const nEntriesPosts = await models.post.count({
            where: {
                topico: id
            }
        });
        logger.info(`Contagem de objetos para o tópico ${id} realizada com sucesso. Cursos: ${nEntriesCursos}, Posts: ${nEntriesPosts}`);
        return res.status(200).json({
            nCursos: nEntriesCursos,
            nPosts: nEntriesPosts
        });
    } catch (error) {
        logger.error(`Erro interno do servidor ao contar objetos do tópico. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao buscar a contagem de objetos.'
        });
    }
};


controllers.delete = async (req, res) => {
    const {
        id
    } = req.params;
    logger.debug(`Recebida requisição para deletar tópico com ID: ${id}`);
    try {
        const dependentCursos = await models.cursotopico.findAll({
            where: {
                topico: id
            },
            include: [{
                model: models.curso,
                as: 'curso_curso',
                attributes: ['idcurso', 'nome', 'disponivel', 'thumbnail'],
            }],
        });
        const dependentPosts = await models.post.findAll({
            where: {
                topico: id
            },
            attributes: ['idpost', 'titulo', 'pontuacao']
        });
        if (dependentCursos.length > 0 || dependentPosts.length > 0) {
            logger.warn(`Tentativa de deletar tópico com ID ${id}, mas existem dependências.`);
            const dependencies = {
                cursos: dependentCursos.map(c => ({
                    idcurso: c.curso_curso.idcurso,
                    nome: c.curso_curso.nome,
                    disponivel: c.curso_curso.disponivel
                })),
                posts: dependentPosts
            };
            return res.status(409).json({
                error: 'Não é possível deletar o tópico, pois existem dependências.',
                dependencies: dependencies
            });
        }
        const deletedRows = await models.topico.destroy({
            where: {
                idtopico: id
            }
        });
        if (deletedRows === 0) {
            logger.info(`Tentativa de deletar tópico com ID ${id} que não foi encontrado.`);
            return res.status(404).json({
                error: 'Tópico não encontrado.'
            });
        }
        await models.topicoarea.destroy({
            where: {
                topico: id
            }
        });
        logger.info(`Tópico com ID ${id} e suas associações com áreas deletados com sucesso.`);
        return res.status(200).json({
            message: 'Tópico deletado com sucesso.'
        });
    } catch (error) {
        logger.error(`Erro interno do servidor ao deletar tópico. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao deletar o tópico.'
        });
    }
};

controllers.update = async (req, res) => {
    const {
        id
    } = req.params;
    logger.debug(`Recebida requisição para atualizar tópico com ID: ${id}. Dados: ${JSON.stringify(req.body)}`);
    try {
        const {
            designacao,
            areas
        } = req.body;
        const updatedData = {};
        if (designacao) updatedData.designacao = designacao;
        if (!designacao && !areas) {
            logger.warn(`Tentativa de atualização do tópico com ID ${id} sem dados fornecidos.`);
            return res.status(400).json({
                error: 'Nenhum campo fornecido para atualização.'
            });
        }
        if (areas && areas.length === 0) {
            logger.warn(`Tentativa de atualizar tópico com ID ${id} sem áreas fornecidas.`);
            return res.status(400).json({
                error: 'Pelo menos uma área deve ser fornecida.'
            });
        }
        if (designacao) {
            const [affectedCount] = await models.topico.update(updatedData, {
                where: {
                    idtopico: id
                }
            });
            if (affectedCount === 0) {
                logger.warn(`Tópico com ID ${id} não encontrado durante a atualização da designação.`);
                return res.status(404).json({
                    error: 'Tópico não encontrado.'
                });
            }
        }
        if (areas) {
            await updateAreas(id, areas);
        }
        const result = await models.topico.findOne({
            where: {
                idtopico: id
            }
        });
        if (!result) {
            logger.warn(`Tópico com ID ${id} não encontrado após a atualização.`);
            return res.status(404).json({
                error: 'Tópico não encontrado.'
            });
        }
        result.dataValues.areas = await findAreas(id);
        logger.info(`Tópico com ID ${id} atualizado com sucesso.`);
        return res.status(200).json(result);
    } catch (error) {
        logger.error(`Erro interno do servidor ao atualizar tópico. Detalhes: ${error.message}`, {
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno ao atualizar o tópico.'
        });
    }
};


module.exports = controllers;
