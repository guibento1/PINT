const Sequelize = require('sequelize');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

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
        console.error('Error in updateAreas:', error);
    }
}

controllers.list = async (req,res) => {

    try {
        const data = await models.topico.findAll();


        for (let topico of data) {
            topico.dataValues.areas = await findAreas(topico.idtopico);
        }

        res.json(data);
    } catch (error) {
        return res.status(400).json({ error: 'Something bad happened' });
    }
};


controllers.byID = async (req, res) => {
    const id = req.params.id;

    try {
        const data = await models.topico.findOne({ where: { idtopico: id } });

        if (!data) {
            return res.status(404).json({ error: 'topico not found' });
        }

        data.dataValues.areas = await findAreas(id);

        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};


controllers.listCursos = async (req, res) => {

    const { id } = req.params;

    try {

        let data = await models.cursotopico.findAll({ 
            where: { topico: id }
            ,include: [{
                model: models.curso,
                as: 'curso_curso', 
                attributes: ['idcurso', 'nome', 'disponivel', 'thumbnail'],
            }],
        });


        data = data.map(c => ({
            idcurso: c.curso_curso.idcurso, 
            nome: c.curso_curso.nome,
            disponivel: c.curso_curso.disponivel,
            thumbnail: c.curso_curso.thumbnail
        }));

        return res.status(200).json(data);

    } catch (error) {
        res.status(400).json({ message: 'Something went wrong' });
    }
};


controllers.listPosts = async (req, res) => {

    const { id } = req.params;

    try {

        const data = await models.post.findAll({ where: { topico: id },attributes: ['idpost', 'titulo', 'pontuacao'] });
        res.status(200).json(data);

    } catch (error) {
        res.status(400).json({ message: 'No post found under category' });
    }
};


controllers.create = async (req, res) => {
    const { designacao, areas } = req.body;

    const insertData = {
        designacao
    };

    try {
        const createdRow = await models.topico.create(insertData, {
            returning: true,
        });


        if (areas == undefined || areas==null || areas.length==0) {

            return res.status(400).json({ message: 'At least one area must be provided' });

        } else {

            let topicoAreasInserts = [];

            for (area of areas){
                topicoAreasInserts.push({topico:createdRow.idtopico, area:area})
            }

            await models.topicoarea.bulkCreate(topicoAreasInserts);
        }

        createdRow.dataValues.areas = await findAreas(createdRow.idtopico);
        return res.status(201).json(createdRow);

    } catch (error) {
        console.error('Error creating topic:', error);
        return res.status(500).json({ message: 'Error creating topic' });
      }
};


controllers.delete = async (req,res) => {

  const id = req.params.id;
  var dependencies = {};


  let data = await models.cursotopico.findAll({ 
    where: { topico: id }
    ,include: [{
        model: models.curso,
        as: 'curso_curso', 
        attributes: ['idcurso', 'nome', 'disponivel', 'thumbnail'],
    }],
  });


  dependencies.cursos = data.map(c => ({
    idcurso: c.curso_curso.idcurso, 
    nome: c.curso_curso.nome,
    disponivel: c.curso_curso.disponivel
  }));


  dependencies.posts = await models.post.findAll({ where: { topico: id },attributes: ['idpost', 'titulo', 'pontuacao'] });

  try {

    if( dependencies.cursos.length > 0 || dependencies.posts.length > 0){
        return res.status(400).json({
            message:"Cannot delete Area : dependencies existence",
            dependencies : dependencies        
        });
    }

    await models.topico.destroy({ where: { idtopico: id } }) ;
    return res.status(200).json({message:"Topico deleted"});

  } catch (error) {
    return res.status(401).json({ error: 'Something bad happened' });
  }

};


controllers.update = async (req, res) => {
    const { id } = req.params;
    const { designacao, areas } = req.body;

    const updatedData = {};
    if (designacao) updatedData.designacao = designacao;

    try {

        const [affectedCount, updatedRows] = await models.topico.update(updatedData, {
            where: { idtopico: id },
            returning: true,
        });

        if ((affectedCount === 0 || updatedRows.length === 0) && areas == undefined) {
            return res.status(404).json({ message: 'Topico not found or no change made' });
        }

        if(areas !== undefined && areas.length == 0 ){
            return res.status(401).json({ message: 'At least one area must be provided' });
        }

        await updateAreas(id, areas);

        const result = await models.topico.findOne({ where: { idtopico: id } });
        result.dataValues.areas = await findAreas(id);
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: 'Error updating Category' });
    }
};


module.exports = controllers;
