const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoriaController.js'); 


router.get('/id/:id',authenticateJWT,categoriaController.byID);
router.delete('/id/:id',authenticateJWT,authorizeRoles('admin'),categoriaController.delete);
router.put('/id/:id',authenticateJWT,authorizeRoles('admin'),categoriaController.update);
router.get('/list',authenticateJWT,categoriaController.list);
router.get('/id/:id/list',authenticateJWT,categoriaController.listAreas);
router.post('/',authenticateJWT,authorizeRoles('admin'),categoriaController.create);


module.exports = router;
