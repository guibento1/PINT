const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cursoController = require('../controllers/cursoController.js'); 

router.get('/list', authenticateJWT, cursoController.list);
router.get('/:id', authenticateJWT, cursoController.getCurso);
router.post('/cursoassincrono', authenticateJWT, authorizeRoles('admin'), upload.single('thumbnail'), cursoController.createCursoAssincrono);
router.post('/licao/:idcursoassinc', authenticateJWT, authorizeRoles('admin'), cursoController.addLicao);
router.post('/licao/:idlicao/addContent', authenticateJWT, authorizeRoles('admin'), upload.single('ficheiro'), cursoController.addLicaoContent);
router.delete('/licao/:idlicao', authenticateJWT, authorizeRoles('admin'), cursoController.rmLicao );
router.put('/cursoassincrono/:idcursoassinc', authenticateJWT, authorizeRoles('admin'), cursoController.updateCursoAssincrono );

module.exports = router;
