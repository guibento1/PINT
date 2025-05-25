const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const utilizadorController = require('../controllers/utilizadorController.js'); 

router.get('/',utilizadorController.byEmail);
router.get('/list',utilizadorController.list);
router.get('/id/:id',utilizadorController.byID);
router.put('/id/:id',utilizadorController.update);
router.post('/',utilizadorController.create);
router.post('/test', upload.single('foto'), utilizadorController.test);
router.delete('/id/:id',utilizadorController.delete);
router.patch('/activate/:id',utilizadorController.activate);

module.exports = router;
