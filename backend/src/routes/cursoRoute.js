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
router.get('/inscricoes/:id', authenticateJWT, authorizeRoles('admin','formador'), cursoController.getInscricoes);
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

// Avaliacoes

router.post('/cursosincrono/:id/avalicaocontinua', authenticateJWT, authorizeRoles('admin','formador'), upload.single('enunciado'), cursoController.createAvaliacaoContinua );
router.put('/cursosincrono/:id/avalicaocontinua/:idavalicao', authenticateJWT, authorizeRoles('admin','formador'), upload.single('enunciado'), cursoController.editAvaliacaoContinua );
router.delete('/cursosincrono/:id/avalicaocontinua/:idavalicao', authenticateJWT, authorizeRoles('admin', 'formador'), cursoController.rmAvaliacaoContinua);
router.post('/cursosincrono/:id/avalicaocontinua/:idavalicao/submeter', authenticateJWT, authorizeRoles('formando'), upload.single('ficheiro'), cursoController.addSubmissao);
router.put('/cursosincrono/:id/avalicaocontinua/:idavalicao/submeter', authenticateJWT, authorizeRoles('formando'), upload.single('ficheiro'), cursoController.updateSubmissao);
router.get('/cursosincrono/:id/avalicaocontinua/:idavalicao/submissoes', authenticateJWT, authorizeRoles('admin','formador'), cursoController.listSubmissoes);
router.put('/cursosincrono/:id/avalicaocontinua/:idavalicao/corrigir', authenticateJWT, authorizeRoles('admin','formador'), cursoController.gradeSubmissao);

router.post('/cursosincrono/:id/formando/:formando/avaliacaofinal', authenticateJWT, authorizeRoles('admin','formador'), cursoController.addAvaliacaoFinal);
router.put('/cursosincrono/:id/formando/:formando/avaliacaofinal', authenticateJWT, authorizeRoles('admin','formador'), cursoController.editAvaliacaoFinal);
router.delete('/cursosincrono/:id/formando/:formando/avaliacaofinal', authenticateJWT, authorizeRoles('admin','formador'), cursoController.rmAvaliacaoFinal);

// Certificado 

router.post('/cursosincrono/:id/certificado', authenticateJWT, authorizeRoles('admin'), cursoController.addCertificado );
router.put('/certificado/:idcertificado', authenticateJWT, authorizeRoles('admin'), cursoController.updateCertificado );
router.delete('/certificado/:idcertificado', authenticateJWT, authorizeRoles('admin'), cursoController.deleteCertificado );
router.get('/cursosincrono/:id/certificados', authenticateJWT, cursoController.getCertificados );

module.exports = router;
