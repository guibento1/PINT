const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const notificacaoController = require('../controllers/notificacaoController.js'); 

router.get('/listChannels',authenticateJWT,authorizeRoles('admin'),notificacaoController.listCanais);
router.get('/listNotifications/:idCanal',authenticateJWT,authorizeRoles('admin'),notificacaoController.listNotificacoes);
router.post('/criarNotificacaoGeral',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoGeral);
router.post('/criarNotificacaoAdministrativa',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoAdministrativa);
router.post('/criarNotificacaoCurso',authenticateJWT,authorizeRoles('admin','formador'),notificacaoController.criarNotificacaoCurso);

module.exports = router;
