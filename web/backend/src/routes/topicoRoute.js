const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const topicoController = require('../controllers/topicoController.js'); 


router.get('/id/:id',authenticateJWT,topicoController.byID);
router.delete('/id/:id',authenticateJWT,authorizeRoles('admin'),topicoController.delete);
router.put('/id/:id',authenticateJWT,authorizeRoles('admin'),topicoController.update);
router.get('/list',authenticateJWT,topicoController.list);
router.get('/id/:id/listcursos',authenticateJWT,topicoController.listCursos);
router.get('/id/:id/listposts',authenticateJWT,topicoController.listPosts);
router.post('/',authenticateJWT,authorizeRoles('admin'),topicoController.create);


module.exports = router;
