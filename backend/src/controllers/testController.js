const { uploadFile, deleteFile, generateSASUrl, sendFCMNotification, sendEmail } = require('../utils.js');
const crypto = require('crypto');
const path = require('path');
const { generateAccessToken } = require('../middleware.js');

var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

const controllers = {};

controllers.jwt = async (req,res) => {

    const responseData = { 

        accessToken: generateAccessToken( {
            idutilizador: 1,
            roles : [
              {
                role: "formando",
                id: "5"
              },
              {
                role: "formador",
                id: "2"
              }
            ] 
        })

    };

    return res.status(200).json(responseData);
};


controllers.fileupload = async (req,res) => {

    const file = req.file;
    const fileBuffer = file.buffer;
    const fileName = file.originalname;
    const fileExtension = path.extname(fileName).toLowerCase();
    const blobName = crypto.randomBytes(16).toString('hex').slice(0, 16) + fileExtension;

    await uploadFile(fileBuffer, blobName, "test");

    const responseData = { 
        fileUrl: await generateSASUrl(blobName,"test")
    };

    return res.status(200).json(responseData);
};


controllers.auth = async (req,res) => {

    const responseData = { 
        message: "Sucesso"
    };

    return res.status(200).json(responseData);
};


controllers.sendEmail = async (req,res) => {


    const data = {
        to:'abanialn@sharklasers.com' ,
        subject: 'Teste de email',
        text: 'Isto é um email'
    };

    sendEmail(data);

    const responseData = { 
        message: "Sucesso"
    };

    return res.status(200).json(responseData);
};


controllers.sendNotification = async (req,res) => {
    return  res.json(await sendFCMNotification('test', 'Boas Malta', 'Isto é uma notificação de teste faz o favor de ignorar'));
};

module.exports = controllers;
