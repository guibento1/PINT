var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

const controllers = {};

controllers.list = async (req,res) => {

    try {
        const data = await models.categoria.findAll();
        res.json(data);
            
    } catch (error) {
        return res.status(400).json({ error: 'Something bad happened' });
    }
};


controllers.byID = async (req,res) => {

  const id = req.params.id;

  try {

    var data = await models.categoria.findOne({ where: { idcategoria: id } }) ;

    if (data == null) {
        return res.status(404).json({ error: 'Categoria not found' });
    } 
     
    res.json(data);

  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: 'Something bad happened' });
  }

};


controllers.create = async (req,res) => {


  const { designacao } = req.body;
  const insertData = {};

  insertData.designacao = designacao;

  if ( designacao != undefined && designacao != null ){

    try {

      const createdRow = await models.categoria.create(insertData, {returning: true});
      res.status(200).json(createdRow);
        
    } catch (error) {
        res.status(500).json({ message: 'Error creating Category' });
    }
  }

};


controllers.delete = async (req,res) => {

  const id = req.params.id;

  try {

    await models.categoria.destroy({ where: { idcategoria: id } }) ;
    res.status(200).json({message:"Categoria deleted"});

  } catch (error) {

    return res.status(400).json({ error: 'Something bad happened' });
  }

};


module.exports = controllers;
