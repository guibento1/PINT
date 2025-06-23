const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cursoController = require('../controllers/cursoController.js'); 

router.get('/list', authenticateJWT, cursoController.list);
router.post('/create/cursoassincrono', authenticateJWT, authorizeRoles('admin'), upload.single('thumbnail'), cursoController.createCursoAssincrono);
router.get('/list/topicos', authenticateJWT, cursoController.getCursosByTopicos);
router.get('/list/areas', authenticateJWT, cursoController.getCursosByAreas);
router.get('/list/categorias', authenticateJWT, cursoController.getCursosByCategorias);
router.post('/create/licao/:idcursoassinc', authenticateJWT, authorizeRoles('admin'), cursoController.addLicao);
router.post('/licao/:idlicao/addContent', authenticateJWT, authorizeRoles('admin'), upload.single('ficheiro'), cursoController.addLicaoContent);
router.delete('/licao/:idlicao', authenticateJWT, authorizeRoles('admin'), cursoController.rmLicao );
// router.delete('/licao/:idlicao/rmContent', authenticateJWT, authorizeRoles('admin'), cursoController.addLicao);
// router.delete('/licao/:idlicao', authenticateJWT, authorizeRoles('admin'), cursoController.addLicao);

module.exports = router;
