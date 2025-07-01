const { authenticateJWT, authorizeRoles } = require('../middleware.js');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const testController = require('../controllers/testController.js'); 

router.post('/jwt', testController.jwt);
router.post('/fileupload', upload.single('file'), testController.fileupload);
router.post('/auth', authenticateJWT, authorizeRoles('admin', 'formando'), testController.auth);
router.post('/sendemail',testController.sendEmail);
router.post('/sendnotification', testController.sendNotification);

module.exports = router;
