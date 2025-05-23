var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

const controllers = {};

controllers.list = async (req,res) => {

    try {
        const data = await models.area.findAll();
        res.json(data);
    } catch (error) {
        return res.status(400).json({ error: 'Something bad happened' });
    }
};


controllers.byID = async (req,res) => {

  const id = req.params.id;

  try {

    var data = await models.area.findOne({ where: { idarea: id } }) ;

    if (data == null) {
        return res.status(404).json({ error: 'Area not found' });
    } 
     
    res.json(data);

  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: 'Something bad happened' });
  }

};


controllers.create = async (req,res) => {


  const { designacao,categoria } = req.body;

  const insertData = {
    designacao,
    categoria
  };

  try {

    const createdRow = await models.area.create(insertData, {returning: true});
    res.status(200).json(createdRow);
        
  } catch (error) {
    res.status(500).json({ message: 'Error creating Area' });
  }

};


controllers.delete = async (req,res) => {

  const id = req.params.id;

  try {


    const data = await models.topicoarea.findAll({ 
        where: { area: id },
        include: [{
            model: models.topico,
            as: 'topico_topico', 
            attributes: ['idtopico', 'designacao'],
        }],
    });

    if( data.length > 0){
        return res.status(400).json({message:"Cannot delete Area : dependencies existence",
            dependencies : data.map(dep => ({
                idtopico: dep.topico_topico.idtopico, 
                designacao: dep.topico_topico.designacao
            })) 
        });
    }

    await models.area.destroy({ where: { idarea: id } }) ;
    res.status(200).json({message:"Area deleted"});

  } catch (error) {
    return res.status(401).json({ error: 'Something bad happened' });
  }

};


controllers.update = async (req, res) => {
    const { id } = req.params;
    const { designacao, categoria } = req.body;

    const updatedData = {};
    if (designacao) updatedData.designacao = designacao;
    if (categoria) updatedData.categoria = categoria;

    try {
        const [affectedCount, updatedRows] = await models.area.update(updatedData, {
            where: { idarea: id },
            returning: true,
        });

        if (affectedCount === 0 || updatedRows.length === 0) {
            return res.status(404).json({ message: 'Area not found or no change made' });
        }

        const result = await models.area.findOne({ where: { idarea: id } });
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: 'Error updating Area' });
    }
};


controllers.listTopicos = async (req, res) => {

    const { id } = req.params;

    try {

        const data = await models.topicoarea.findAll({ 
            where: { area: id },
            include: [{
                model: models.topico,
                as: 'topico_topico', 
                attributes: ['idtopico', 'designacao'],
            }],
        });

        res.status(200).json(
            data.map(dep => ({
                idtopico: dep.topico_topico.idtopico, 
                designacao: dep.topico_topico.designacao
            })) 
        );

    } catch (error) {
        console.log(error);
        res.status(400).json({ message: 'No topicos found under category' });
    }
};


module.exports = controllers;
