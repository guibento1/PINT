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


async function addInscrito(cursosIn,idFormando) {

    if(! (typeof cursosIn[Symbol.iterator] === 'function' )) cursosIn = [cursosIn];

    const cursosOut = await Promise.all(

        cursosIn.map(async (curso) => {
            const data = await models.inscricao.findOne({
                where: { curso: curso.idcurso, formando: idFormando },
            });

            curso.dataValues.inscrito = !!data;
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
            if (curso.thumbnail) {
                curso.dataValues.thumbnail = await generateSASUrl(curso.thumbnail, 'thumbnailscursos');
            }
            return curso;
        })
    );


    return cursos;

}


async function filterCursos(cursos, topicosIn = [], areasIn = [], categoriasIn = []) {

  const checkIfcursoInTopicos = async (curso, topicos) => {
    if (!topicos.length) return false;

    const nEntries = await models.cursotopico.count({
      where: {
        curso: curso.idcurso,
        topico: { [Sequelize.Op.in]: topicos }
      }
    });

    return nEntries > 0;
  };

  const checkIfcursoInAreas = async (curso, areas) => {
    if (!areas.length) return false;

    const data = await models.topicoarea.findAll({
      where: {
        area: { [Sequelize.Op.in]: areas }
      }
    });

    if (!data || !data.length) return false;

    const topicos = data.map((entry) => entry.topico);
    return checkIfcursoInTopicos(curso, topicos);
  };

  const checkIfcursoInCategorias = async (curso, categorias) => {
    if (!categorias.length) return false;

    const data = await models.area.findAll({
      where: {
        categoria: { [Sequelize.Op.in]: categorias }
      },
      attributes: ['idarea']
    });

    if (!data || !data.length) return false;

    const areas = data.map((entry) => entry.idarea);
    return checkIfcursoInAreas(curso, areas);
  };

  const matchedCursos = await Promise.all(
      cursos.map(async (curso) => {
        const match =
          (await checkIfcursoInTopicos(curso, topicosIn)) ||
          (await checkIfcursoInAreas(curso, areasIn)) ||
          (await checkIfcursoInCategorias(curso, categoriasIn));

        return match ? curso : null;
      })
    );

  return matchedCursos.filter(Boolean);
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


        if (data && data.length > 0){

            topicos = data.map((entry) => entry.topico);
            cursos = await getCursosByTopicos(topicos)
            return cursos;
        }

        return [];

    } catch (error) {
        console.log(error);
        return [];
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

        return [];

    } catch (error) {
        console.log(error);
        return [];
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

    if(createdRow.thumbnail){
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


  if (existingCurso.thumbnail) {
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
    const formando = req.user.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;

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
        let cursos = await filterCursoResults(req.user.roles, data);
        cursos = await addTipo(cursos); 

        if (req.query.sincrono) {
            cursos = cursos.filter((curso) => curso.dataValues.sincrono == (req.query.sincrono == "true"));
        }

        if(formando) cursos = await addInscrito(cursos,formando);

        return res.status(200).json(cursos);

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


        if (curso.thumbnail) {
            curso.dataValues.thumbnail = await generateSASUrl(curso.thumbnail, 'thumbnailscursos');
        }

        if(curso.dataValues.sincrono){


            if(acessible) {


                data = await models.cursosincrono.findOne({
                   where: {
                       curso : id
                   },

                   attributes: [
                        "idcursosincrono"
                   ]
                });

                curso.dataValues.idcrono = data.idcursosincrono; 


            //TODO
            
            }

        } else {

            if(acessible) {


                data = await models.cursoassincrono.findOne({
                   where: {
                       curso : id
                   },

                   attributes: [
                        "idcursoassincrono"
                   ]
                });

                curso.dataValues.idcrono = data.idcursoassincrono; 

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

        curso = await addTipo(curso);
        if(formando) curso = await addInscrito(curso,formando);

        return res.status(200).json(curso);
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: "Something bad happened" });
        
    }


}


controllers.getCursoInscritos = async (req, res) => {

    const idUtilizador = req.params.idutilizador;
    let topicos = [];
    let areas = [];
    let categorias = [];
    let filter = false;

    let cursos;
    let data;


    if( 
        req.user.idutilizador == idUtilizador || 
        ( req.user.roles && req.user.roles.map((roleEntry) => roleEntry.role).includes("admin") ) 
    ){

        const queryOptions = 

            {

                attributes: [
                    "idcurso",
                    "nome",
                    "disponivel",
                    "iniciodeinscricoes",
                    "fimdeinscricoes",
                    "planocurricular",
                    "maxinscricoes",
                    "thumbnail"
                ],

                where: {}
            }

        if(req.query.search){
            queryOptions.where.nome = {
                [Sequelize.Op.iLike]: `%${req.query.search}%`
            };
        }

        try {
            


            data = await models.formando.findOne({ where: { utilizador : idUtilizador } });
            if (!data){

                return res.status(404).json({message:"User does not have formando role, no formando has found with the provided userId"})

            }

            const idFormando = data.idformando;

            data = await models.inscricao.findAll({ where: { formando : idFormando } });
            
            if( data.length == 0){
                return res.status(200).json({message:"no courses were found"});
            }

            const cursosIndexes = data.map( (inscricao) => inscricao.curso );

            queryOptions.where.idcurso = {
                [Sequelize.Op.in]: cursosIndexes
            };

            console.log(queryOptions);

            cursos = await models.curso.findAll(queryOptions);

            cursos = await Promise.all(
                cursos.map(async (curso) => {
                    if (curso.thumbnail) {
                        curso.dataValues.thumbnail = await generateSASUrl(curso.thumbnail, 'thumbnailscursos');
                    }
                    return curso;
                })
            );


            if (req.query.area) {
                areas = Array.isArray(req.query.area) ? req.query.area : [req.query.area];
                areas = [...new Set(areas)];
                filter = true;
            }

            if (req.query.categoria) {
                categorias = Array.isArray(req.query.categoria) ? req.query.categoria : [req.query.categoria];
                categorias = [...new Set(categorias)];
                filter = true;
            }

            if (req.query.topico) {
                topicos = Array.isArray(req.query.topico) ? req.query.topico : [req.query.topico];
                topicos = [...new Set(topicos)];
                filter = true;
            }

            if(filter){
                cursos = await filterCursos(cursos,topicos,areas,categorias);
            }

            return res.status(200).json(await addTipo(cursos));


        } catch (error) {
            return res.status(500).json({message: "Something wrong happened"});
        }

    }


    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });


};


controllers.getInscricoes = async (req, res) => {

    const id  = req.params.id;
    let data;

    try {

        data = await models.inscricao.findAll({ 
            where: { curso : id } ,
            include: [{
                model: models.formando,
                as: 'formando_formando', 
                attributes: ['utilizador'],
            }],

        });

        const utilizadoresindexes = data.map((entry) => entry.formando_formando.utilizador);


        let utilizadores = await models.utilizadores.findAll({

            attributes: ["idutilizador","email","nome"],
            where: {
                idutilizador: {
                    [Sequelize.Op.in]: utilizadoresindexes
                },
                ativo : true
            }
        });

        utilizadores = utilizadores.map((utilizador) => {
            utilizador.dataValues.idformando = data.find((entry) => entry.formando_formando.utilizador == utilizador.idutilizador).formando; 

            return utilizador;
        }) 

        return res.status(200).json(utilizadores);
            
    } catch (error) {

        return res.status(400).json({message:"Something Bad Happended"});
    }

};


controllers.inscreverCurso = async (req, res) => {
    const { utilizador: utilizadorIdDoBody } = req.body || {};
    const cursoId = req.params.id;

    let formandoId; 
    let cursoEncontrado;

    try {
        if (utilizadorIdDoBody &&
            !req.user.roles?.map(roleEntry => roleEntry.role).includes("admin") && 
            req.user.idutilizador != utilizadorIdDoBody) 
        {
            return res.status(403).json({ message: 'Acesso Proibido: Permissões insuficientes para inscrever outro utilizador.' });
        }

        const idDoUtilizadorParaInscricao = utilizadorIdDoBody || req.user.idutilizador;

        const formandoData = await models.formando.findOne({
            where: { utilizador: idDoUtilizadorParaInscricao }
        });

        if (!formandoData) {
            return res.status(404).json({
                message: "Utilizador não é um formando ou formando não encontrado com o ID fornecido."
            });
        }
        formandoId = formandoData.idformando; 

        cursoEncontrado = await models.curso.findByPk(cursoId);

        if (!cursoEncontrado) {
            return res.status(404).json({ message: "Curso não encontrado." });
        }

        const maxInscricoes = cursoEncontrado.maxinscricoes;
        const nInscricoes = await models.inscricao.count({ where: { curso: cursoId } });

        const inscricaoExistente = await models.inscricao.findOne({
            where: {
                formando: formandoId,
                curso: cursoId
            }
        });

        if (inscricaoExistente) {
            return res.status(409).json({ message: 'Já se encontra inscrito neste curso.' }); // 409 Conflict
        }


        if (cursoEncontrado.disponivel && (!maxInscricoes || nInscricoes < maxInscricoes)) {
            const insertData = {
                formando: formandoId,
                curso: cursoId,
                registo: new Date()
            };
            await models.inscricao.create(insertData);
            return res.status(200).json({ message: 'Inscrição realizada com sucesso!' }); 
        } else {
            return res.status(400).json({ message: 'Vagas esgotadas ou curso não disponível para inscrição.' });
        }

    } catch (error) {
        console.error("Erro na inscrição do curso:", error);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar inscrever no curso.' });
    }
};


controllers.sairCurso = async (req, res) => {

    const id = req.params.id;
    
    const { utilizador: utilizadorIdDoBody } = req.body || {}; 
    
    let data;

    if (
      utilizadorIdDoBody &&
      !(
        (req.user.roles?.map(roleEntry => roleEntry.role).includes("admin")) ||
        req.user.idutilizador == utilizadorIdDoBody
      )
    ) {
      return res.status(403).json({ message: 'Acesso Proibido: Permissões insuficientes para desinscrever outro utilizador.' });
    }

    const idDoUtilizadorParaDesinscricao = utilizadorIdDoBody || req.user.idutilizador;

    try {
        const formandoData = await models.formando.findOne({ 
            where: { utilizador: idDoUtilizadorParaDesinscricao } 
        });

        if (!formandoData){
            return res.status(404).json({message:"Utilizador não é um formando ou formando não encontrado com o ID fornecido."});
        }

        const formando = formandoData.idformando;

        const inscricaoExistente = await models.inscricao.findOne({
            where: { formando, curso: id }
        });

        if (!inscricaoExistente) {
            return res.status(404).json({ message: 'Inscrição não encontrada para este utilizador e curso.' });
        }
        
        await models.inscricao.destroy({
            where : { formando, curso : id }
        });

        return res.status(200).json({ message: 'Inscrição removida com sucesso!' });

    } catch (error) {
        console.error("Erro ao tentar desinscrever do curso:", error);
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar sair do curso.' });
    }
};


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

        const data = await models.curso.findByPk(id);

        // const data = await models.cursoassincrono.findOne({
        //     where: {
        //        curso: id
        //     }
        // });

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
