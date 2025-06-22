const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cursoController = require('../controllers/cursoController.js'); 

router.get('/list', authenticateJWT, cursoController.list);
router.post('/create/cursoassincrono', authenticateJWT, authorizeRoles('admin'), upload.single('thumbnail'), cursoController.createCursoAssincrono);
router.get('/listbytopicos', authenticateJWT, cursoController.getCursosByTopicos);
router.get('/listbyareas', authenticateJWT, cursoController.getCursosByAreas);
router.get('/listbycategorias', authenticateJWT, cursoController.getCursosByCategorias);
//router.post('/create/cursosincrono', authenticateJWT, authorizeRoles('admin'), cursoController.createcursoassincrono);

// router.post('/login', cursoController.loginUser);
// router.get('/id/:id', authenticateJWT, cursoController.byID);
// router.put('/id/:id', authenticateJWT, upload.single('foto'), cursoController.update);
// router.delete('/id/:id', authenticateJWT, cursoController.delete);
// router.patch('/activate/:id', authenticateJWT, cursoController.activate);
// router.post('/register', cursoController.register);
// router.post('/resetpassword', authenticateJWT, cursoController.resetPassword);

module.exports = router;
