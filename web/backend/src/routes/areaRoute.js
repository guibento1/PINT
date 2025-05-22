const express = require('express');
const router = express.Router();

const areaController = require('../controllers/areaController.js'); 


router.get('/id/:id',areaController.byID);
router.delete('/id/:id',areaController.delete);
router.put('/id/:id',areaController.update);
router.get('/list',areaController.list);
router.get('/id/:id/list',areaController.listTopicos);
router.post('/',areaController.create);


module.exports = router;
