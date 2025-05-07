const express = require('express');
const router = express.Router();

const utilizadorController = require('../controllers/utilizadorController.js'); 

router.get('/',utilizadorController.byEmail);
router.get('/id/:id',utilizadorController.byID);
router.post('/id/:id',utilizadorController.update);
router.post('/',utilizadorController.create);

module.exports = router;
