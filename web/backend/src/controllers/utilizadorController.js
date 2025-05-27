const { uploadFile, deleteFile, generateSASUrl } = require('../utils.js');
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const crypto = require('crypto');
const path = require('path');

// Aux Functions

async function findRoles(id) {
    var roles = [];

    const admin = await models.admin.findOne({ where: { utilizador: id, ativo: true } });
    const formando = await models.formando.findOne({ where: { utilizador: id, ativo: true } });
    const formador = await models.formador.findOne({ where: { utilizador: id, ativo: true } });

    if (admin != null) roles.push({ role: "admin", id: admin.idadmin });
    if (formando != null) roles.push({ role: "formando", id: formando.idformando });
    if (formador != null) roles.push({ role: "formador", id: formador.idformador });

    return roles;
}

async function updateRoles(id, roles) {

    try {
        const existingRoles = await findRoles(id);

        for (const role of ['admin', 'formando', 'formador']) {
            const hasRole = roles.includes(role);
            const currentlyHas = existingRoles.some(r => r.role === role);

            if (hasRole && !currentlyHas) {
                await models[role].create({ 
                    utilizador: id,
                });
            } else if (!hasRole && currentlyHas) {
                await models[role].destroy({ where: { utilizador: id }, force: true });
            }
        }
    } catch (error) {
        throw error;
    }

}


async function updateFoto(fotoFile, existingBlob = null) {

    const fileExtensions = [".jpg", ".png"];

    if (!fotoFile || !fotoFile.buffer || !fotoFile.originalname) {
        throw 'Invalid fotoFile object';
    }

    try {
        if (existingBlob !== null) {
            try {
                await deleteFile(existingBlob, "userprofiles");
            } catch (error) {
                console.error(`Error deleting existing file: ${error}`);
                throw error;
            }
        }

        const fileBuffer = fotoFile.buffer;
        const originalFileName = fotoFile.originalname;
        const fileExtension = path.extname(originalFileName).toLowerCase();

        if (!fileExtensions.includes(fileExtension)) {
            throw `Profile Pic must be one of the following: ${fileExtensions.join(", ")}`;
        }

        const blobName = crypto.randomBytes(16).toString('hex').slice(0, 16) + fileExtension;

        try {
            await uploadFile(fileBuffer, blobName, "userprofiles");
        } catch (error) {
            console.error(`Error uploading file: ${error}`);
            throw error;
        }

        return blobName;
    } catch (error) {
        console.error(`Error updating profile picture: ${error}`);
        throw error;
    }
}

const controllers = {};

controllers.byEmail = async (req, res) => {

    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const data = await models.utilizadores.findOne({ 
            where: { email },
            attributes: ["idutilizador","email","nome","dataregisto","foto","ativo"]
        });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!data.ativo) {
            return res.status(403).json({ error: 'User disabled' });
        }

        data.dataValues.roles = await findRoles(data.idutilizador);
        data.dataValues.foto =  data.dataValues.foto ? await generateSASUrl(data.dataValues.foto, 'userprofiles') : null;
        res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Something bad happened' });
    }
};



controllers.validateUser = async (req, res) => {

    const email = req.query.email;
    const { password } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const data = await models.utilizadores.findOne({ 
            where: { email }
        });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!data.ativo) {
            return res.status(403).json({ error: 'User disabled' });
        }

        if (!password) {
            return res.status(403).json({ error: 'No password provided' });
        }

        const passwordhash = crypto.pbkdf2Sync(password, data.salt, 1000, 64, 'sha512').toString('hex') ;

        if(passwordhash == data.passwordhash){

            data.dataValues.roles = await findRoles(data.idutilizador);
            data.dataValues.foto =  data.dataValues.foto ? await generateSASUrl(data.dataValues.foto, 'userprofiles') : null;


            const responseData = { 
                idutilizador: data.idutilizador, 
                email: data.email, 
                nome: data.nome,
                dataregisto: data.dataregisto,
                ativo: data.ativo, 
                foto: data.dataValues.foto, 
                roles: data.dataValues.roles 
            };

            res.status(200).json(responseData);
        }

        return res.status(400).json({ error: 'Password mismatch' });
        

    } catch (error) {
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.byID = async (req, res) => {
    const id = req.params.id;

    try {


        const data = await models.utilizadores.findOne({ 
            where: { idutilizador: id },
            attributes: ["idutilizador","email","nome","dataregisto","foto","ativo"]
        });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!data.ativo) {
            return res.status(403).json({ error: 'User disabled' });
        }

        data.dataValues.roles = await findRoles(id);
        data.dataValues.foto =  data.dataValues.foto ? await generateSASUrl(data.dataValues.foto, 'userprofiles') : null;
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.update = async (req, res) => {

    const { id } = req.params;

    const foto = req.file;
    const { nome, email, password, morada, telefone, roles } = JSON.parse(req.body.info);
    
    const updatedData = {};
    if (nome) updatedData.nome = nome;
    if (email) updatedData.email = email;
    if (morada !== undefined) updatedData.morada = morada;
    if (telefone !== undefined) updatedData.telefone = telefone;

    try {

        
        var result = await models.utilizadores.findOne({ where: { idutilizador: id } });


        if (password){
            const passwordhash = crypto.pbkdf2Sync(password, result.salt, 1000, 64, 'sha512').toString('hex') ;
            updatedData.passwordhash = passwordhash;
        }

        if(foto){

            updatedData.foto = await updateFoto(foto,result.foto);

        }
        
        if (Object.keys(updatedData).length !== 0) {
            
            const [affectedCount, updatedRows] = await models.utilizadores.update(updatedData, {
                where: { idutilizador: id, ativo: true },
                returning: true,
            });

            if (affectedCount === 0 && roles === undefined) {
                return res.status(404).json({ message: 'User not found or inactive' });
            }

            if (affectedCount === 0 && roles === undefined) {
                return res.status(404).json({ message: 'User not found or inactive' });
            }
        }


        if (roles !== undefined) {
            await updateRoles(id, roles);
        }


        result = await models.utilizadores.findOne({ 
            where: { idutilizador: id } ,
            attributes: ["idutilizador","email","nome","dataregisto","foto","ativo"]
        });

        result.dataValues.roles = await findRoles(id);
        result.dataValues.foto = await generateSASUrl(result.foto, 'userprofiles');

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating User' });
    }
};


controllers.list = async (req,res) => {

    try {

        const data = await models.utilizadores.findAll({ 
            attributes: ["idutilizador","email","nome","dataregisto","foto","ativo"]
        });

        for (let user of data) {
            user.dataValues.roles = await findRoles(user.idutilizador);
            user.dataValues.foto =  user.dataValues.foto ? await generateSASUrl(user.dataValues.foto, 'userprofiles') : null;
        }
            
        res.status(200).json(data);

    } catch (error) {
        return res.status(400).json({ error: 'Something bad happened' });
    }
};

controllers.create = async (req, res) => {

    const foto = req.file;
    var fotoUrl = null;
    const { nome, email, password, morada, telefone, roles }  = JSON.parse(req.body.info);


    const salt = crypto.randomBytes(8).toString('hex');
    const passwordhash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex') ;

    const insertData = {
        nome,
        email,
        salt,
        passwordhash,
        dataregisto: new Date(),
    };

    if (morada !== undefined) insertData.morada = morada;
    if (telefone !== undefined) insertData.telefone = telefone;

    try {


        if(foto){

            insertData.foto = await updateFoto(foto);
            fotoUrl = await generateSASUrl(insertData.foto, 'userprofiles');

        }

        const createdRow = await models.utilizadores.create(insertData, {
            returning: true,
        });

        if (roles !== undefined) {
            await updateRoles(createdRow.idutilizador, roles);
        }



        createdRow.dataValues.roles = await findRoles(createdRow.idutilizador);
        createdRow.dataValues.foto = fotoUrl;



    const responseData = { 
        idutilizador: createdRow.idutilizador, 
        email: createdRow.email, 
        nome: createdRow.nome,
        dataregisto: createdRow.dataregisto,
        ativo: createdRow.ativo, 
        foto: createdRow.dataValues.foto, 
        roles: createdRow.dataValues.roles 
    };

        res.status(201).json(responseData);

    } catch (error) {
        const dbMessage = error?.parent?.message || '';

        if (dbMessage.includes('Utilizador existente')) {
          return res.status(409).json({ error: 'User with that email already exists' });
        }

        console.error('Error creating User:', error);
        return res.status(500).json({ message: 'Error creating User' });
      }
};

controllers.delete = async (req, res) => {
    const id = req.params.id;

    try {
        const user = await models.utilizadores.findOne({ where: { idutilizador: id } });

        if (!user || !user.ativo) {
            return res.status(404).json({ message: 'User not found or already inactive' });
        }

        await models.utilizadores.destroy({ where: { idutilizador: id } });

        return res.status(204).json({ message: 'User deactivated' }); 
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.activate = async (req, res) => {
    const id = req.params.id;

    try {

        const data = await models.utilizadores.findOne({ where: { idutilizador: id } });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        await models.utilizadores.update({ ativo: true }, { where: { idutilizador: id } });
        return res.status(200).json({ message: 'User activated' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.test = async (req, res) => {

        var fileUrl = "";

        const file = req.file;
        const { nome } = JSON.parse(req.body.info);

        if(req.file){

            const fileBuffer = req.file.buffer;
            const originalFileName = req.file.originalname;
            const fileExtension = path.extname(originalFileName).toLowerCase();

            if(fileExtension != ".jpg"){
                res.status(400).json({ message: 'Profile Pic must be a .jpg'});
            }


            const blobName = crypto.randomBytes(16).toString('hex').slice(0,16) + fileExtension;

            try {

                await uploadFile(fileBuffer, blobName,"userprofiles");
                const blobUrl = await generateSASUrl(blobName, 'userprofiles');

                return res.status(200).json({ message: 'blobUrl: '+blobUrl});
            } catch (error) {
                return res.status(400).json({ message: 'upload failed'});
                console.log(error);
            }

        }

        console.log('Uploaded File:', file);  
        console.log('Form Data:', nome); 

        res.status(200).json({ message: 'All Good'});
}

module.exports = controllers;
