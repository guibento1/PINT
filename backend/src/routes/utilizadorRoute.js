//web\backend\src\routes\utilizadorRoute.js
const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const utilizadorController = require('../controllers/utilizadorController.js'); 

router.get('/', authenticateJWT, authorizeRoles('admin'), utilizadorController.byEmail);
router.get('/list', authenticateJWT, authorizeRoles('admin'), utilizadorController.list);
router.post('/login', utilizadorController.loginUser);
router.get('/id/:id', authenticateJWT, utilizadorController.byID);
router.put('/id/:id', authenticateJWT, upload.single('foto'), utilizadorController.update);
router.delete('/id/:id', authenticateJWT, utilizadorController.delete);
router.patch('/activate/:id', authenticateJWT, utilizadorController.activate);
router.post('/register', utilizadorController.register);
router.post('/resetpassword', authenticateJWT, utilizadorController.resetPassword);

router.get('/me', authenticateJWT, (req, res) => {
  res.status(200).json(req.user);
});

module.exports = router;
