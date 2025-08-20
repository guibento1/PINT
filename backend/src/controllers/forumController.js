var initModels = require("../models/init-models.js");
var db = require("../database.js");
const logger = require('../logger.js');
var models = initModels(db);

const controllers = {};