const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const notificacaoController = require('../controllers/notificacaoController.js'); 


router.get('/listChannels',notificacaoController.listCanais);
// router.get('/getUserNotifications/:id',notificacaoController.getNotificacoes);
// router.delete('/id/:id',notificacaoController.delete);
// router.put('/id/:id',notificacaoController.update);
// router.get('/list',notificacaoController.list);
// router.get('/id/:id/listcursos',notificacaoController.listCursos);
// router.get('/id/:id/listposts',notificacaoController.listPosts);
// router.post('/',notificacaoController.create);


module.exports = router;
