const Sequelize = require('sequelize');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const {  updateFile, generateSASUrl } = require('../utils.js');

const controllers = {};


async function findTopicos(id) {

    let data = await models.cursotopico.findAll({ 
        where: { curso: id }
        ,include: [{
            model: models.topico,
            as: 'topico_topico', 
            attributes: ['idtopico', 'designacao'],
        }],
    });

    if(data){
        data = data.map(t => ({
            idtopico: t.topico_topico.idtopico, 
            designacao: t.topico_topico.designacao
        })) 
        return data
    }

    return [];

}


async function updateTopicos(id, topicos) {

    try {
        let cursoTopicosInserts = [];
        let existingTopicos = await findTopicos(id);
        existingTopicos = existingTopicos.map(eTopico => eTopico.idtopico);

        const topicosToDelete = existingTopicos.filter(topico => !topicos.includes(topico));
        const topicosToInsert = topicos.filter(topico => !existingTopicos.includes(topico));

        if (topicosToDelete.length > 0) {
            await models.cursotopico.destroy({
                where: {
                    topico: {
                        [Sequelize.Op.in]: topicosToDelete
                    }
                }
            });
        }

        for (const topico of topicosToInsert) {
            cursoTopicosInserts.push({ topico: topico, curso: id });
        }

        if (cursoTopicosInserts.length > 0) {
            await models.cursotopico.bulkCreate(cursoTopicosInserts);
        }

    } catch (error) {
        console.error('Error in updateTopicos:', error);
    }
}

async function addTipo(cursosIn) {

    const cursosOut = await Promise.all(

        cursosIn.map(async (curso) => {
            const data = await models.cursosincrono.findOne({
                where: { curso: curso.idcurso },
            });

            // curso.dataValues.topicos = await findTopicos(curso.idcurso);
            curso.dataValues.sincrono = !!data;
            return curso;
        })

    );

    return cursosOut;
}


async function filterCursoResults(roles,cursos) {

    let data;

    const admin = roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;
    const formando = roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;
    const formador = roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;

    let cursosfiltrados = null;


    if (!admin){

        let cursosLecionados=[];
        let cursosInscritos=[];

        if (formador) {

            data = await models.cursosincrono.findAll({
                where: { formador: formador },
                attributes: ["curso"]
            });

            data.length > 0 ? (data = data.map((c) => c.curso)) : (data = []);

            cursosLecionados = data;

        }

        if (formando){

            data = await models.inscricao.findAll({
                where: { formando: formando },
                attributes: ["curso"]
            });

            data.length > 0 ? (data = data.map((c) => c.curso)) : (data = []);

            cursosInscritos = data;

        }


        cursosfiltrados = cursos.filter((curso) => ( 
            curso.disponivel || 
            cursosInscritos.includes(curso.idcurso) || 
            cursosLecionados.includes(curso.idcurso)
        ));

    }

    if ( cursosfiltrados != null ){
        return cursosfiltrados;
    }


    return cursos;

}


async function filterCursoResults(roles,cursos) {

    let data;

    const admin = roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;
    const formando = roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;
    const formador = roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;

    let cursosfiltrados = null;


    if (!admin){

        let cursosLecionados=[];
        let cursosInscritos=[];

        if (formador) {

            data = await models.cursosincrono.findAll({
                where: { formador: formador },
                attributes: ["curso"]
            });

            data.length > 0 ? (data = data.map((c) => c.curso)) : (data = []);

            cursosLecionados = data;

        }

        if (formando){

            data = await models.inscricao.findAll({
                where: { formando: formando },
                attributes: ["curso"]
            });

            data.length > 0 ? (data = data.map((c) => c.curso)) : (data = []);

            cursosInscritos = data;

        }


        cursosfiltrados = cursos.filter((curso) => ( 
            curso.disponivel || 
            cursosInscritos.includes(curso.idcurso) || 
            cursosLecionados.includes(curso.idcurso)
        ));

    }

    if ( cursosfiltrados != null ){
        return cursosfiltrados;
    }


    return cursos;

}


async function getCursosByTopicos(topicos,roles) {


    let idcursos = [];

    try {

        data = await models.cursotopico.findAll({

            where: {
                topico: {
                    [Sequelize.Op.in]: topicos
                }
            },
            attributes: ["curso"]

        });

        if (data.length > 0){

            idcursos = data.map((entry) => entry.curso);


            data = await models.curso.findAll({

                where: {
                    idcurso: {
                        [Sequelize.Op.in]: idcursos
                    }
                },

                attributes: [
                    "idcurso",
                    "nome",
                    "disponivel",
                    "iniciodeinscricoes",
                    "fimdeinscricoes",
                    "maxinscricoes",
                    "thumbnail"
                ]

            });


            cursos = data;
            cursos = await filterCursoResults(roles,cursos);
            return await addTipo(cursos);
        }

        return null;
        
    } catch (error) {
        console.log(error);
        return null;
    }

}


async function getCursosByAreas(areas,roles) {
    
    let topicos = [];


    try {

        data = await models.topicoarea.findAll({

            where: {
                area: {
                    [Sequelize.Op.in]: areas
                }
            },
            attributes: ["topico"]

        });


        if (data.length > 0){

            topicos = data.map((entry) => entry.topico);
            cursos = await getCursosByTopicos(topicos,roles)
            return cursos;
        }

        return null;

    } catch (error) {
        console.log(error);
        return null;
    }

}


async function getCursosByCategorias(categorias,roles) {
    
    let areas = [];


    try {

        data = await models.area.findAll({

            where: {
                categoria: {
                    [Sequelize.Op.in]: categorias
                }
            },
            attributes: ["idarea"]

        });


        if (data.length > 0){

            areas = data.map((entry) => entry.idarea);
            cursos = await getCursosByAreas(areas,roles)
            return cursos;
        }

        return null;

    } catch (error) {
        console.log(error);
        return null;
    }

}

controllers.list = async (req, res) => {

    try {

        if (req.user.roles) {

            let data;
            let cursos;

            data = await models.curso.findAll({
                attributes: [
                    "idcurso",
                    "nome",
                    "disponivel",
                    "iniciodeinscricoes",
                    "fimdeinscricoes",
                    "maxinscricoes",
                    "thumbnail"
                ]
            });

            cursos = data;
            cursos = await filterCursoResults(req.user.roles,cursos);
            return res.status(200).json(await addTipo(cursos));
        }
    } catch (error) {
        return res.status(400).json({ error: "Something bad happened" });
    }
};




controllers.getCursosByAreas = async (req, res) => {

    let data;    
    let areas = [];
    Array.isArray(req.query.area) ? areas = req.query.area : areas.push(req.query.area);
    areas = [...new Set(areas)];

    const cursos = await getCursosByAreas(areas,req.user.roles); 

    if(cursos == null){
        return res.status(404).json({ message: 'No cursos Found' });
    }

    return res.status(200).json(cursos);


}


controllers.getCursosByCategorias = async (req, res) => {

    let data;    
    let categorias = [];
    Array.isArray(req.query.categoria) ? categorias = req.query.categoria : categorias.push(req.query.categoria);
    categorias = [...new Set(categorias)];

    const cursos = await getCursosByCategorias(categorias,req.user.roles); 

    if(cursos == null){
        return res.status(404).json({ message: 'No cursos Found' });
    }

    return res.status(200).json(cursos);


}


controllers.getCursosByTopicos = async (req, res) => {

    let topicos = [];
    Array.isArray(req.query.topico) ? topicos = req.query.topico : topicos.push(req.query.topico);
    const cursos = await getCursosByTopicos(topicos,req.user.roles);

    if(cursos == null){
        return res.status(404).json({ message: 'No cursos Found' });
    }

    return res.status(200).json(cursos);


}


controllers.createCursoAssincrono = async (req, res) => {

    const thumbnail = req.file;
    const { nome, disponivel, iniciodeinscricoes, fimdeinscricoes, planocurricular, topicos } = JSON.parse(req.body.info || "{}");


    const insertData = {
        nome,
        disponivel,
        iniciodeinscricoes
    };

    if (fimdeinscricoes !== undefined) insertData.fimdeinscricoes = fimdeinscricoes;
    if (planocurricular !== undefined) insertData.planocurricular = planocurricular;

    try {

        if(thumbnail){
            insertData.thumbnail = await updateFile(thumbnail, [".jpg", ".png"], "thumbnailscursos");
        }


        const createdRow = await models.curso.create(insertData, {
            returning: true,
        });


        if (topicos == undefined || topicos==null || topicos.length==0) {
            return res.status(400).json({ message: 'At least one topic must be provided' });
        } 

        await updateTopicos(createdRow.idcurso,topicos);
        await models.cursoassincrono.create({curso:createdRow.idcurso});

        if(createdRow.thumbnail){
            createdRow.dataValues.thumbnail = await generateSASUrl(createdRow.thumbnail, 'thumbnailscursos');
        }

        createdRow.dataValues.topicos = await findTopicos(createdRow.idcurso);
        return res.status(200).json(createdRow);
            
    } catch (error) {

        console.error('Error creating curso:', error);
        return res.status(500).json({ message: 'Error creating curso' });
        
    }

}





module.exports = controllers;
