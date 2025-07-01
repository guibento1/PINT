const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const areaController = require('../controllers/areaController.js'); 

authenticateJWT,authorizeRoles('admin')

router.get('/id/:id',authenticateJWT,areaController.byID);
router.delete('/id/:id',authenticateJWT,authorizeRoles('admin'),areaController.delete);
router.put('/id/:id',authenticateJWT,authorizeRoles('admin'),areaController.update);
router.get('/list',authenticateJWT,areaController.list);
router.get('/id/:id/list',authenticateJWT,areaController.listTopicos);
router.post('/',authenticateJWT,authorizeRoles('admin'),areaController.create);


module.exports = router;
