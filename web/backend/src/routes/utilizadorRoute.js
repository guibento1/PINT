const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const utilizadorController = require('../controllers/utilizadorController.js'); 

router.get('/', authenticateJWT, authorizeRoles('admin'), utilizadorController.byEmail);
router.get('/list', authenticateJWT, authorizeRoles('admin'), utilizadorController.list);
router.get('/login', utilizadorController.loginUser);
router.get('/id/:id', authenticateJWT, utilizadorController.byID);
router.put('/id/:id', authenticateJWT, upload.single('foto'), utilizadorController.update);
router.post('/', upload.single('foto'), utilizadorController.create);
router.delete('/id/:id', authenticateJWT, utilizadorController.delete);
router.patch('/activate/:id', authenticateJWT, utilizadorController.activate);
//router.post('/test', authenticateJWT, authorizeRoles('admin', 'formador'), utilizadorController.test);

module.exports = router;
