const controllers = {}

controllers.root = (req,res) => {
    res.send( "Projeto PINT");
};

module.exports = controllers;
