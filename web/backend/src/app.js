const express  = require("express");
const app = express();
const port = 3000;

var cors = require('cors')

app.set('port',port);
app.use(express.json());
app.use(cors())

app.listen(port, () => {
    console.log("listening on port "+port);
})

const index = require('./routes/indexRoute.js');
const utilizador = require('./routes/utilizadorRoute.js');
const categoria = require('./routes/categoriaRoute.js');
const area = require('./routes/areaRoute.js');

// Route Defenition
app.use('/',(req, res, next) => {
  console.log('URL: %s',req.originalUrl);
  console.log('Data e Hora: %s', Date.now().toString());
  next();
});


app.use('/',index);
app.use('/utilizador',utilizador);
app.use('/categoria',categoria);
app.use('/area',area);

