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


controllers.getCanaisInscritos = async (req, res) => {

    const idUtilizador = req.params.idutilizador;

    let canais = [1];
    const admin = ( req.user.roles && req.user.roles.map((roleEntry) => roleEntry.role).includes("admin") );

    if(admin) canais.push(2);

    let cursos;
    let data;


    if( 
        req.user.idutilizador == idUtilizador || admin
    ){

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


            cursosCanais = await models.curso.findAll({
                atributtes:["canal"],
                where : { 
                    idcurso = { [Sequelize.Op.in]: cursosIndexes }
                }
            });

            cursosCanais = cursosCanais.map((curso) => cursos.canal);
            canais = [...canais,...cursosCanais]
            return res.status(200).json(canais);

        } catch (error) {
            return res.status(500).json({message: "Something wrong happened"});
        }

    }


    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });


};


module.exports = controllers;
