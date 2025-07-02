const Sequelize = require('sequelize');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const {  updateFile, deleteFile, generateSASUrl, isLink } = require('../utils.js');

const controllers = {};


async function findTopicos(id) {

    let data = await models.cursotopico.findAll({ 
        where: { curso: id },
        include: [{
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

    if(! (typeof cursosIn[Symbol.iterator] === 'function' )) cursosIn = [cursosIn];

    const cursosOut = await Promise.all(

        cursosIn.map(async (curso) => {
            const data = await models.cursosincrono.findOne({
                where: { curso: curso.idcurso },
            });
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

        cursosfiltrados = await Promise.all( 

            cursosfiltrados.map(async (curso) => {

                if(curso.thumbnail && !isLink(curso.thumbnail)){
                    curso.dataValues.thumbnail = await generateSASUrl(curso.thumbnail, 'thumbnailscursos');
                }
                return curso;
            })

        );

        return cursosfiltrados;
    }


    cursos = await Promise.all(
        cursos.map(async (curso) => {
            if (curso.thumbnail && !isLink(curso.thumbnail)) {
                curso.dataValues.thumbnail = await generateSASUrl(curso.thumbnail, 'thumbnailscursos');
            }
            return curso;
        })
    );


    return cursos;

}


async function getCursosByTopicos(topicos) {


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

        cursos = ( data && data.length > 0) ? data.map((entry) => parseInt(entry.curso)) : [];

        return cursos;
        
    } catch (error) {
        console.log(error);
        return null;
    }

}


async function getCursosByAreas(areas) {
    
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
            cursos = await getCursosByTopicos(topicos)
            return cursos;
        }

        return null;

    } catch (error) {
        console.log(error);
        return null;
    }

}


async function getCursosByCategorias(categorias) {
    
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
            cursos = await getCursosByAreas(areas)
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

            try {
                await deleteFile(referencia,"ficheiroslicao");
            } catch (error) {
                console.log("Could not delete the file, prop does not exist");
            }
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


async function createCurso(thumbnail,info) {


    const { nome, disponivel, iniciodeinscricoes, fimdeinscricoes, planocurricular, topicos } = info;

    const insertData = {
        nome,
        disponivel,
        iniciodeinscricoes
    };

    if (fimdeinscricoes !== undefined) insertData.fimdeinscricoes = fimdeinscricoes;
    if (planocurricular !== undefined) insertData.planocurricular = planocurricular;


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

    if(createdRow.thumbnail && !isURL(createdRow.thumbnail)){
        createdRow.dataValues.thumbnail = await generateSASUrl(createdRow.thumbnail, 'thumbnailscursos');
    }

    createdRow.dataValues.topicos = await findTopicos(createdRow.idcurso);
    return createdRow;

}


async function updateCurso(id, thumbnail, info) {

  const { nome, disponivel, iniciodeinscricoes, fimdeinscricoes, planocurricular, topicos } = info;

  const existingCurso = await models.curso.findByPk(id);
  if (!existingCurso) {
    throw new Error(`Curso with id ${id} not found`);
  }

  const updateData = {};

  if (nome !== undefined) updateData.nome = nome;
  if (disponivel !== undefined) updateData.disponivel = disponivel;
  if (iniciodeinscricoes !== undefined) updateData.iniciodeinscricoes = iniciodeinscricoes;
  if (fimdeinscricoes !== undefined) updateData.fimdeinscricoes = fimdeinscricoes;
  if (planocurricular !== undefined) updateData.planocurricular = planocurricular;

  if (thumbnail) {
    updateData.thumbnail = await updateFile(thumbnail, "thumbnailscursos", existingCurso.thumbnail, [".jpg", ".png"]);
  }

  await existingCurso.update(updateData);

  if(topicos){

      if (topicos.length === 0) {
        throw new Error('At least one topic must be provided');
      }

      await updateTopicos(existingCurso.idcurso, topicos);
  }


  if (existingCurso.thumbnail && !isURL(existingCurso.thumbnail)) {
    existingCurso.dataValues.thumbnail = await generateSASUrl(existingCurso.thumbnail, 'thumbnailscursos');
  }

  existingCurso.dataValues.topicos = await findTopicos(existingCurso.idcurso);

  return existingCurso;

}




controllers.list = async (req, res) => {

    let topicos = [];
    let areas = [];
    let categorias = [];
    let filter = [];

    const filterFlag = req.query.area || req.query.categoria || req.query.topico;

    const queryOptions = {

        attributes: [
            "idcurso",
            "nome",
            "disponivel",
            "iniciodeinscricoes",
            "fimdeinscricoes",
            "maxinscricoes",
            "thumbnail"
        ]

    };

    try {

        if (req.query.area) {
            areas = Array.isArray(req.query.area) ? req.query.area : [req.query.area];
            areas = [...new Set(areas)];
            filter.push(...await getCursosByAreas(areas));
        }

        if (req.query.categoria) {
            categorias = Array.isArray(req.query.categoria) ? req.query.categoria : [req.query.categoria];
            categorias = [...new Set(categorias)];
            filter.push(...await getCursosByCategorias(categorias));
        }

        if (req.query.topico) {
            topicos = Array.isArray(req.query.topico) ? req.query.topico : [req.query.topico];
            topicos = [...new Set(topicos)];
            filter.push(...await getCursosByTopicos(topicos));
        }

        filter = [...new Set(filter)];

        if (filterFlag) {
            queryOptions.where = {
                idcurso: {
                    [Sequelize.Op.in]: filter
                }
            };
        }

        if (req.query.search) {

            if (!queryOptions.where)  queryOptions.where = {};
        
            queryOptions.where.nome = {
                [Sequelize.Op.iLike]: `%${req.query.search}%`
            };
        }


        const data = await models.curso.findAll(queryOptions);

        if (req.user.roles) {
            const cursos = await filterCursoResults(req.user.roles, data);
            return res.status(200).json(await addTipo(cursos));
        }

        return res.status(200).json(await addTipo(data));

    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: "Something bad happened" });
    }
};


controllers.rmCurso = async (req, res) => {

    const id  = req.params.id;

    try {

        let data = await models.curso.findByPk(id,{
            attributes: [
                "idcurso",
                "nome",
                "disponivel",
                "iniciodeinscricoes",
                "fimdeinscricoes",
                "planocurricular",
                "maxinscricoes",
                "thumbnail"
            ]
        });

        const curso = await addTipo(data);


        if(curso.sincrono){

            //TODO

        } else {


            let data = await models.licao.findAll({

                where: {
                    curso : id ,
                },

                attributes: [
                    "idlicao"
                ]

            });

            await Promise.all(

                data.map(async (entry) => {
                    await rmLicao(entry.idlicao);
                })

            );


            await models.curso.destroy({
                where: {
                    idcurso : id
                }
            });

        }


        return res.status(200).json({message:"Curso sucessfully deleted"});

            
    } catch (error) {

        console.log(error);
        return res.status(500).json({message:"Something went wrong"});
        
    }



}


controllers.getCurso = async (req, res) => {

    const id  = req.params.id;
    let acessible = false;
    
    const admin = req.user.roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;
    const formando = req.user.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;

    if(formando){

        let data = await models.inscricao.findOne({
            where: {
                curso : id ,
                formando : formando
            },
        });

        if(data){
            acessible = true;
        }

    }

    if(admin){
        acessible = true;
    }

    try {


        let data = await models.curso.findOne({

            where: {
                idcurso : id ,
            },

            attributes: [
                "idcurso",
                "nome",
                "disponivel",
                "iniciodeinscricoes",
                "fimdeinscricoes",
                "planocurricular",
                "maxinscricoes",
                "thumbnail"
            ]

        });


        let curso = data; 
        if( !data || ( !data.disponivel && !acessible ) ) return res.status(404).json({"message":"curso non existent or not acessible"});


        curso.dataValues.topicos = await findTopicos(id);
        curso = (await addTipo(curso))[0];

        if(curso.sincrono){

            //TODO

        } else {

            if(acessible) {

                data = await models.licao.findAll({
                   where: {
                       curso : id
                   },

                   attributes: [
                    "idlicao",
                    "titulo",
                    "descricao"
                   ]
                });

                let licoes;

                data && data.length > 0 ? licoes = data : licoes = [];

                licoes = await Promise.all(

                    licoes.map(async (licao) => {


                        data = await models.licaomaterial.findAll({
                            where: {
                               licao: licao.idlicao,
                            },

                            attributes: [],

                            include: [{
                                model: models.material,
                                as: 'material_material', 
                                attributes: ['idmaterial', 'titulo', 'referencia', 'tipo'],
                            }],
                        });

                        if (data) {
                          data = await Promise.all(data.map(async (entry) => {
                            let out = entry.material_material;

                            if (!isLink(out.referencia)) {
                              out.dataValues.referencia = await generateSASUrl(out.referencia, 'ficheiroslicao');
                            }

                            return out;
                          }));
                        }

                        licao.dataValues.materiais = data;
                        return licao;
                    })
                );


                curso.dataValues.licoes = licoes; 

            }


        }

        return res.status(200).json(curso);
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: "Something bad happened" });
        
    }


}


controllers.createCursoAssincrono = async (req, res) => {

    const thumbnail = req.file;
    const info = JSON.parse(req.body.info || "{}");

    try {

        const createdRow = await createCurso(thumbnail,info);

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


controllers.updateCursoAssincrono = async (req, res) => {

    const id = req.params.id;
    const thumbnail = req.file;
    const info = JSON.parse(req.body.info || "{}");

    try {

        const data = await models.cursoassincrono.findOne({
            where: {
               curso: id
            }
        });

        if(data){
            updatedCurso = await updateCurso(id, thumbnail, info);
            return res.status(200).json(updatedCurso);
        }

    } catch (error) {
        console.error('Error updating curso:', error);
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
