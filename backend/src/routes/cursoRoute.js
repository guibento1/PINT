const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cursoController = require('../controllers/cursoController.js'); 

// Cursos Geral

router.get('/list', authenticateJWT, cursoController.list);
router.get('/:id', authenticateJWT, cursoController.getCurso);
router.get('/inscricoes/utilizador/:idutilizador', authenticateJWT, authorizeRoles('admin','formando'),  cursoController.getCursoInscritos);
router.get('/inscricoes/:id', authenticateJWT, authorizeRoles('admin'), cursoController.getInscricoes);
router.post('/:id/inscrever', authenticateJWT, authorizeRoles('admin','formando'), cursoController.inscreverCurso );
router.post('/:id/sair', authenticateJWT, authorizeRoles('admin','formando'), cursoController.sairCurso );
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), cursoController.rmCurso );

// Curso Assincrono

router.post('/cursoassincrono', authenticateJWT, authorizeRoles('admin'), upload.single('thumbnail'), cursoController.createCursoAssincrono);
router.put('/cursoassincrono/:id', authenticateJWT, authorizeRoles('admin'), upload.single('thumbnail'), cursoController.updateCursoAssincrono );
router.post('/licao/:idcursoassinc', authenticateJWT, authorizeRoles('admin'), cursoController.addLicao);
router.delete('/licao/:idlicao', authenticateJWT, authorizeRoles('admin'), cursoController.rmLicao );
router.put('/licao/:idlicao', authenticateJWT, authorizeRoles('admin'), cursoController.updateLicao );
router.post('/licao/:idlicao/material', authenticateJWT, authorizeRoles('admin'), upload.single('ficheiro'), cursoController.addLicaoContent);
router.delete('/licao/:idlicao/material/:idmaterial', authenticateJWT, authorizeRoles('admin'), cursoController.rmLicaoContent );


// Curso Sincrono

router.get('/formador/:idformador', authenticateJWT, cursoController.getCursoLecionados);
router.post('/cursosincrono', authenticateJWT, authorizeRoles('admin'), upload.single('thumbnail'), cursoController.createCursoSincrono);
router.put('/cursosincrono/:id', authenticateJWT, authorizeRoles('admin','formador'), upload.single('thumbnail'), cursoController.updateCursoSincrono );
router.post('/sessao/:idcursosinc', authenticateJWT, authorizeRoles('admin','formador'), cursoController.addSessao);
router.delete('/sessao/:idsessao', authenticateJWT, authorizeRoles('admin','formador'), cursoController.rmSessao );
router.put('/sessao/:idsessao', authenticateJWT, authorizeRoles('admin','formador'), cursoController.updateSessao );
router.post('/sessao/:idsessao/material', authenticateJWT, authorizeRoles('admin','formador'), upload.single('ficheiro'), cursoController.addSessaoContent);
router.delete('/sessao/:idsessao/material/:idmaterial', authenticateJWT, authorizeRoles('admin','formador'), cursoController.rmSessaoContent );

module.exports = router;
