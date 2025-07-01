const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const notificacaoController = require('../controllers/notificacaoController.js'); 

router.get('/listChannels',authenticateJWT,authorizeRoles('admin'),notificacaoController.listCanais);
router.get('/listNotifications/:idCanal',authenticateJWT,authorizeRoles('admin'),notificacaoController.listNotificacoes);
router.post('/creategeneralnotification',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoGeral);
router.post('/createadminnotification',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoAdministrativa);
router.post('/createcoursenotification',authenticateJWT,authorizeRoles('admin','formador'),notificacaoController.criarNotificacaoCurso);

module.exports = router;
