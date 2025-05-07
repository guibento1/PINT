var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

// Aux Functions

async function findRoles(id) {

    var roles = [];

    const admin = await models.admin.findOne({ where: { utilizador: id } })
    const formando = await models.formando.findOne({ where: { utilizador: id } })
    const formador = await models.formador.findOne({ where: { utilizador: id } })

    if (admin != null){
        roles.push({"role":"admin","id":admin.idadmin});
    }

    if (formando != null){
        roles.push({"role":"formando","id":formando.idformando});
    }


    if (formador != null){
        roles.push({"role":"formador","id":formador.idformador});
    }

    return roles;
}

// Controllers

const controllers = {}


controllers.byEmail = async (req,res) => {

  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {

    var data = await models.utilizadores.findOne({ where: { email: email } }) ;

    if (data == null) {
        return res.status(404).json({ error: 'User not found' });
    } 

    data.dataValues.roles = await findRoles(data.idutilizador);

    res.json(data);
    
  } catch (error) {

    console.log(error);
    return res.status(400).json({ error: 'Something bad happened' });

  }

};


controllers.byID = async (req,res) => {

  const id = req.params.id;

  try {

    var data = await models.utilizadores.findOne({ where: { idutilizador: id } }) ;

    if (data == null) {
        return res.status(404).json({ error: 'User not found' });
    } 

    data.dataValues.roles = await findRoles(id);
     
    res.json(data);

  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: 'Something bad happened' });
  }

};


controllers.update = async (req,res) => {


  const { id } = req.params;
  const { nome, email, passwordhash, morada, telefone, foto } = req.body;

  const updatedData = {};
  
  // Falso se null ou undefined
  if (nome) updatedData.nome = nome;
  if (email) updatedData.email = email;
  if (passwordhash) updatedData.passwordhash = passwordhash;

  // Como pode ser null falso apenas quando undefined
  if (morada !== undefined) updatedData.morada = morada;
  if (telefone !== undefined) updatedData.foto = foto;
  if (foto !== undefined) updatedData.foto = foto;

  try {

      const [updatedRowCount, updatedRows] = await models.utilizadores.update(updatedData, {
        where: { idutilizador: id },
        returning: true,
      });

      if (updatedRowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(updatedRows[0]);
    } catch (error) {

        console.error('Error updating User:', error);
        res.status(500).json({ message: 'Error updating User' });
  }

};



module.exports = controllers;
