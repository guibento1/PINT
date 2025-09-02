//web\backend\src\routes\utilizadorRoute.js

const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const utilizadorController = require('../controllers/utilizadorController.js'); 

router.get('/', authenticateJWT, authorizeRoles('admin'), utilizadorController.getByEmail);
router.get('/list', authenticateJWT, authorizeRoles('admin'), utilizadorController.list);
router.post('/login', utilizadorController.loginUser);
router.get('/id/:id', authenticateJWT, utilizadorController.byID);
router.get('/admin/id/:id', authenticateJWT, utilizadorController.getAdmin);
router.get('/formador/id/:id', authenticateJWT, utilizadorController.getFormador);
// Criar o enpoint abaixo para ir buscar incrições, notas e certificados
router.get('/formando/id/:id', authenticateJWT, utilizadorController.getFormando);
router.put('/id/:id', authenticateJWT, upload.single('foto'), utilizadorController.update);
router.delete('/id/:id', authenticateJWT, utilizadorController.delete);
router.patch('/activate/:id', authenticateJWT, utilizadorController.activate);
router.post('/register', utilizadorController.register);
router.post('/resetpassword', authenticateJWT, utilizadorController.resetPassword);

module.exports = router;
