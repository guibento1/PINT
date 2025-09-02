var initModels = require("./models/init-models.js");
var db = require("./database.js");
var models = initModels(db);
const logger = require('./logger.js'); 
const express  = require("express");
const app = express();
const port = 3000;

var cors = require('cors')

app.set('port',port);
app.use(express.json());
app.use(cors())

app.listen(port, () => {
    logger.info("listening on port "+port);
})

// Controladores

const index = require('./routes/indexRoute.js');
const utilizador = require('./routes/utilizadorRoute.js');
const test = require('./routes/testRoute.js');
const categoria = require('./routes/categoriaRoute.js');
const area = require('./routes/areaRoute.js');
const topico = require('./routes/topicoRoute.js');
const notificacao = require('./routes/notificacaoRoute.js');
const curso = require('./routes/cursoRoute.js');
const forum = require('./routes/forumRoute.js');

// Defenicao de rotas

app.use('/',(req, res, next) => {
  logger.info(`URL: ${req.originalUrl}`);
  next();
});


app.use('/',index);
app.use('/utilizador',utilizador);
app.use('/test',test);
app.use('/categoria',categoria);
app.use('/area',area);
app.use('/topico',topico);
app.use('/notificacao',notificacao);
app.use('/curso',curso);
app.use('/forum',forum);
app.get('/certificado/:chave',async (req, res) => {

  const chave = req.params.chave;

  try {

    const certificado = await models.certificadosutilizadores.findOne({where : { chave } });
    if(!certificado){
      return res.status(404).json({message : "Certificado não encontrado confirme a chave"});
    }

    const utilizador = await models.utilizadores.findByPk(certificado.utilizador,{attributes : ["nome"]});
    const certificadoObject = await models.certificados.findByPk(certificado.certificado);

    certificado.dataValues.utilizador = utilizador.nome;
    certificado.dataValues.nome = certificadoObject.nome;
    certificado.dataValues.descricao = certificadoObject.descricao;


    return res.status(200).json(certificado);
  } catch (error) {

    return res.status(500).json({
      error: "Ocorreu um erro interno ao procurar certificado.",
    });
  }

});


