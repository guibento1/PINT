const Sequelize = require('sequelize');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const {  updateFile, deleteFile, generateSASUrl } = require('../utils.js');

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

function isLink(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
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


async function addLicao(idcurso,licao) {

    const createdRow = await models.licao.create(licao, {
        returning: true,
    });

    return createdRow;

}


async function rmLicao(idlicao) {

    let data = await models.licaomaterial.findAll({ 
        where: { licao: idlicao }
        ,include: [{
            model: models.material,
            as: 'material_material', 
            attributes: ['idmaterial', 'referencia'],
        }],
    });

    let materiais = data.map((entry) => entry.material) || [];
    let referencias = data.map((entry) => entry.material_material.referencia) || [];

    for (const referencia in referencias) {
        if (!isLink(referencia)) {
            await deleteFile(referencia,"ficheiroslicao");
        }
    }


    await models.licaomaterial.destroy({ where: { licao: idlicao } });
    await models.material.destroy({ 
        where: { 
            idmaterial : { [Sequelize.Op.in]: materiais }
        } 
    });

    await models.licao.destroy({ 
        where: { 
            idlicao : idlicao 
        } 
    });

}

async function addLicaoContent(idlicao,ficheiro,material) {

    if ( material.referencia !== undefined && ficheiro ){
        throw new error("Ambigous call, link and file provided");
    }

    if (!material.referencia){
        material.referencia = await updateFile(ficheiro, "ficheiroslicao");
    }


    const createdMaterial = await models.material.create(material, {
        returning: true,
    });

    await models.licaomaterial.create({material : createdMaterial.idmaterial, licao : idlicao});

    if ( !isLink(createdMaterial.referencia) ){
        createdMaterial.dataValues.referencia = await generateSASUrl(createdMaterial.referencia, 'ficheiroslicao');
    }

    return createdMaterial;


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
            insertData.thumbnail = await updateFile(thumbnail, "thumbnailscursos", null, [".jpg", ".png"]);
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


controllers.addLicao = async (req, res) => {


    const idcursoassinc = req.params.idcursoassinc;

    const { titulo, descricao } = req.body;


    try {


        const cursoassinc =  await models.cursoassincrono.findOne({
            where : { idcursoassincrono :  idcursoassinc },
            attributes: ["curso"]
        });

        const licao = {
            curso : cursoassinc.curso,
            titulo,
            descricao
        };




        const createdRow = await addLicao(cursoassinc.curso,licao);
        return res.status(200).json(createdRow);

    } catch (error) {
        console.log(error);
        return res.status(500).json({message : "Could not create licao"});
    }

}


controllers.rmLicao = async (req, res) => {

    try {

        await rmLicao(req.params.idlicao);
        return res.status(200).json({"message": "licao sucessfully deleted"});

    } catch (error) {

        return res.status(500).json({"message": "could no delete licao"});
        
    }

}



controllers.addLicaoContent = async (req, res) => {

    const idlicao = req.params.idlicao;
    const ficheiro = req.file;

    const { titulo, tipo, link } = JSON.parse(req.body.info || "{}");


    const material = {
        titulo,
        tipo,
        referencia : link,
        criador : req.user.idutilizador
    };

    try {

        const createdMaterial = await addLicaoContent(idlicao,ficheiro,material);
        return res.status(200).json(createdMaterial);
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : "Could not create material"});
    }

}





module.exports = controllers;
