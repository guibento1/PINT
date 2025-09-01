const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const topicoController = require('../controllers/topicoController.js'); 


router.get('/id/:id',authenticateJWT,topicoController.byID);
router.get('/id/:id/nobjetos',authenticateJWT,topicoController.getNobjetos);
router.delete('/id/:id',authenticateJWT,authorizeRoles('admin'),topicoController.delete);
router.put('/id/:id',authenticateJWT,authorizeRoles('admin'),topicoController.update);
router.get('/list',authenticateJWT,topicoController.list);
router.post('/id/:id/subscribe',authenticateJWT,topicoController.subscribe);
router.delete('/id/:id/unsubscribe',authenticateJWT,topicoController.unsubscribe);
router.get('/subscricoes',authenticateJWT,topicoController.getSubscriptions);
router.post('/',authenticateJWT,authorizeRoles('admin'),topicoController.create);


module.exports = router;
