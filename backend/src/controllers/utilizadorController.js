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


async function updateRoles(id,roles) {

  try {

    const existingRoles = await findRoles(id);

    for (const role of ['admin','formando','formador']) {

      if (roles.includes(role) && !existingRoles.includes(role)){

        models[role].create({ utilizador : id });

      } else if (!roles.includes(role) && existingRoles.includes(role)) {

        models[role].destroy({ where: { utilizador : id }, force: true });

      }
    
    }

    // if (roles.includes('admin') && !existingRoles.includes('admin')){
    //
    //   models.admin.create({ utilizador : id });
    //
    // } else if (!roles.includes('admin') && existingRoles.includes('admin')) {
    //
    //   models.admin.destroy({ where: { utilizador : id }, force: true });
    //
    // }
    //
    //
    // if (roles.includes('formando') && !existingRoles.includes('formando')){
    //
    //   models.formando.create({ utilizador : id });
    //
    // } else if (!roles.includes('formando') && existingRoles.includes('formando')) {
    //
    //   models.formando.destroy({ where: { utilizador : id }, force: true });
    //
    // }
    //
    //
    // if (roles.includes('formador') && !existingRoles.includes('formador')){
    //
    //   models.formador.create({ utilizador : id });
    //
    // } else if (!roles.includes('formador') && existingRoles.includes('formador')) {
    //
    //   models.formador.destroy({ where: { utilizador : id }, force: true });
    //
    // }


  } catch (error) {
    throw error;
  }

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
  const { nome, email, passwordhash, morada, telefone, foto, roles } = req.body;

  const updatedData = {};
  
  // Falso se null ou undefined
  if (nome) updatedData.nome = nome;
  if (email) updatedData.email = email;
  if (passwordhash) updatedData.passwordhash = passwordhash;

  // Como pode ser null falso apenas quando undefined
  if (morada !== undefined) updatedData.morada = morada;
  if (telefone !== undefined) updatedData.telefone = telefone;
  if (foto !== undefined) updatedData.foto = foto;

  try {

      const [updatedRowCount, updatedRows] = await models.utilizadores.update(updatedData, {
        where: { idutilizador: id },
        returning: true,
      });

      if (roles != undefined){
        await updateRoles(id,roles);
      }

      var result = await models.utilizadores.findOne({ where: { idutilizador: id } })
      result.dataValues.roles = await findRoles(id);

      res.status(200).json(result);
    } catch (error) {

        console.error('Error updating User:', error);
        res.status(500).json({ message: 'Error updating User' });
  }

};


controllers.create = async (req,res) => {


  const { nome, email, salt, passwordhash, morada, telefone, foto, roles } = req.body;

  const insertData = {};

  insertData.nome = nome;
  insertData.email = email;
  insertData.salt = salt;
  insertData.passwordhash = passwordhash;
  insertData.dataregisto = new Date();

  if (morada !== undefined) insertData.morada = morada;
  if (telefone !== undefined) insertData.telefone = telefone;
  if (foto !== undefined) insertData.foto = foto;


  try {

      const createdRow = await models.utilizadores.create(insertData, {
        returning: true,
      });

      if (roles != undefined){
        await updateRoles(createdRow.idutilizador,roles);
      }

      createdRow.dataValues.roles = await findRoles(createdRow.idutilizador);

      res.status(200).json(createdRow);
    } catch (error) {

        console.error('Error creating User:', error);
        res.status(500).json({ message: 'Error creating User' });
  }

};



module.exports = controllers;
