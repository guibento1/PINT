const express = require('express');
const router = express.Router();

const utilizadorController = require('../controllers/utilizadorController.js'); 

router.get('/',utilizadorController.byEmail);
router.get('/id/:id',utilizadorController.byID);
router.put('/id/:id',utilizadorController.update);
router.post('/',utilizadorController.create);
router.delete('/id/:id',utilizadorController.delete);
router.patch('/activate/:id',utilizadorController.activate);

module.exports = router;
