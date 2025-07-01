const { sendFCMNotification } = require('../utils.js');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

const controllers = {};

controllers.listCanais = async (req,res) => {

    try {
        const data = await models.canalnotificacoes.findAll();
        res.json(data);
    } catch (error) {
        return res.status(400).json({ error: 'Something bad happened' });
    }
};


controllers.listNotificacoes = async (req,res) => {

  const idCanal = req.params.idCanal;

  try {

    var data = await models.historiconotificacoes.findOne({ where: { idnotificacao: idCanal } }) ;

    if (data == null) {
        return res.status(404).json({ error: 'Area not found' });
    } 
     
    res.status(200).json(data);

  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: 'Something bad happened' });
  }

};


controllers.criarNotificacaoGeral = async (req,res) => {

    const { titulo,conteudo } = req.body;

    console.log(titulo,conteudo);


    const insertData = {
        canal: 1,
        titulo,
        conteudo
    };

    try {

        const createdRow = await models.historiconotificacoes.create(insertData, {returning: true});
        await sendFCMNotification('canal.'+insertData.canal, titulo, conteudo);
        return res.status(200).json(createdRow);

    } catch (error) {
        return res.status(400).json({ error: 'Could not send the notification' });
    }

}


controllers.criarNotificacaoAdministrativa = async (req,res) => {

    const { titulo,conteudo } = req.body;

    console.log(titulo,conteudo);


    const insertData = {
        canal: 2,
        titulo,
        conteudo
    };

    try {

        const createdRow = await models.historiconotificacoes.create(insertData, {returning: true});
        await sendFCMNotification('canal.'+insertData.canal, titulo, conteudo);
        return res.status(200).json(createdRow);
        
    } catch (error) {
        return res.status(400).json({ error: 'Could not send the notification' });
    }

}


controllers.criarNotificacaoCurso = async (req,res) => {

    const { idcurso, titulo,conteudo } = req.body;

    try {

        const curso = await models.curso.findOne({ where: { idcurso: idcurso } });
        const canal = curso.canal;

        const insertData = {
            canal,
            titulo,
            conteudo
        };

        const createdRow = await models.historiconotificacoes.create(insertData, {returning: true});
        await sendFCMNotification('canal.'+insertData.canal, titulo, conteudo);
        return res.status(200).json(createdRow);
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: 'Could not send the notification' });
    }

}


module.exports = controllers;
