// const https = require("https");
// const fs = require("fs");
const express  = require("express");
const app = express();
const port = 3000;

// const options = {
//   key: fs.readFileSync("path/to/server.key"),
//   cert: fs.readFileSync("path/to/server.cert")
// };

var cors = require('cors')

app.set('port',port);
app.use(express.json());
app.use(cors())

app.listen(port, () => {
    console.log("listening on port "+port);
})

const index = require('./routes/indexRoute.js');
const utilizador = require('./routes/utilizadorRoute.js');
const test = require('./routes/testRoute.js');
const categoria = require('./routes/categoriaRoute.js');
const area = require('./routes/areaRoute.js');
const topico = require('./routes/topicoRoute.js');
const notificacao = require('./routes/notificacaoRoute.js');
const curso = require('./routes/cursoRoute.js');

// Route Defenition
app.use('/',(req, res, next) => {
  console.log('URL: %s',req.originalUrl);
  console.log('Data e Hora: %s', Date.now().toString());
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

// https.createServer(options, app).listen(port, () => {
//   console.log(`HTTPS server listening on port ${port}`);
// });

