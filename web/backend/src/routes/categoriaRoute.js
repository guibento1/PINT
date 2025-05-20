const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoriaController.js'); 


router.get('/id/:id',categoriaController.byID);
router.delete('/id/:id',categoriaController.delete);
router.put('/id/:id',categoriaController.update);
router.get('/list',categoriaController.list);
router.post('/',categoriaController.create);


module.exports = router;
