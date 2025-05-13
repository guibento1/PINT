const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoriaController.js'); 


router.get('/id/:id',categoriaController.byID);
router.get('/delete/:id',categoriaController.delete);
router.get('/list',categoriaController.list);
router.post('/',categoriaController.create);


module.exports = router;
