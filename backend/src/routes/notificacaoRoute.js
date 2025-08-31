const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const notificacaoController = require('../controllers/notificacaoController.js'); 

router.get('/list',authenticateJWT,notificacaoController.listUserNotifications);
router.get('/list/canais',authenticateJWT,authorizeRoles('admin'),notificacaoController.listCanais);
router.get('/list/canal/:idCanal',authenticateJWT,authorizeRoles('admin'),notificacaoController.listNotificacoesByCanal);
router.get('/list/subscricoes/:idutilizador',authenticateJWT,notificacaoController.getCanaisInscritos);
router.post('/create/general',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoGeral);
router.post('/create/admin',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoAdministrativa);
router.post('/create/course',authenticateJWT,authorizeRoles('admin','formador'),notificacaoController.criarNotificacaoCurso);
router.post('/create/utilizador/:idutilizador',authenticateJWT,authorizeRoles('admin'),notificacaoController.criarNotificacaoUtilizador);
router.post('/devicesub',authenticateJWT,notificacaoController.subscribeDeviceToCanais);
router.post('/deviceregister',authenticateJWT,notificacaoController.registerDevice);

module.exports = router;
