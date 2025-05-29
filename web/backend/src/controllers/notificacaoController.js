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


module.exports = controllers;
