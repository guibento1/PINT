const express = require('express');
const router = express.Router();

const topicoController = require('../controllers/topicoController.js'); 


router.get('/id/:id',topicoController.byID);
router.delete('/id/:id',topicoController.delete);
router.put('/id/:id',topicoController.update);
router.get('/list',topicoController.list);
router.get('/id/:id/listcursos',topicoController.listCursos);
router.get('/id/:id/listposts',topicoController.listPosts);
router.post('/',topicoController.create);


module.exports = router;
