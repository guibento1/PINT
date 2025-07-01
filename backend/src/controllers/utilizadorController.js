const { uploadFile, deleteFile, updateFile, generateSASUrl, sendEmail } = require('../utils.js');
const { generateAccessToken } = require('../middleware.js');

var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);

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



controllers.loginUser = async (req, res) => {

    const { email, password } = req.body;

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

            if(data.passwordhash == null){
                return res.status(400).json({ message: 'User has not confirmed email' });
            }

            return res.status(403).json({ error: 'User disabled' });
        }

        if (!password) {
            return res.status(403).json({ error: 'No password provided' });
        }

        const passwordhash = crypto.pbkdf2Sync(password, data.salt, 1000, 64, 'sha512').toString('hex') ;

        if(passwordhash == data.passwordhash){

            data.dataValues.roles = await findRoles(data.idutilizador);

            if(!data.dataValues.roles){
                return res.status(500).json({ error: 'User has no roles' });
            }

            data.dataValues.foto =  data.dataValues.foto ? await generateSASUrl(data.dataValues.foto, 'userprofiles') : null;

            const responseData = { 
                idutilizador: data.idutilizador, 
                email: data.email, 
                nome: data.nome,
                dataregisto: data.dataregisto,
                ativo: data.ativo, 
                foto: data.dataValues.foto, 
                roles: data.dataValues.roles,
                accessToken: generateAccessToken( {
                    idutilizador: data.idutilizador,
                    roles : data.dataValues.roles 
                })
            };

            return res.status(200).json(responseData);
        }

        return res.status(400).json({ error: 'Password mismatch' });
        

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.byID = async (req, res) => {

    const id = req.params.id;

    // Controlador apenas acessivel para admin ou utilizadores com alvo a si próprios
    
    if( 
        req.user.idutilizador == id || 
        ( req.user.roles && req.user.roles.map((roleEntry) => roleEntry.role).includes("admin") ) 
    ){


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

            return res.status(200).json(data);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Something bad happened' });
        }

    }


    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });

    
};

controllers.update = async (req, res) => {

    const { id } = req.params;


    // Controlador apenas acessivel para admin ou utilizadores com alvo a si próprios
    
    if( 
        req.user.idutilizador == id || 
        ( req.user.roles && req.user.roles.map((roleEntry) => roleEntry.role).includes("admin") ) 
    ){

        const foto = req.file;
        const updatedData = {};


        const { nome, email, password, morada, telefone, roles } = JSON.parse(req.body.info || "{}");

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

                updatedData.foto = await updateFile( foto, "userprofiles", result.foto, [".jpg", ".png"]);

            }
            
            if (Object.keys(updatedData).length !== 0) {
                
                const [affectedCount, updatedRows] = await models.utilizadores.update(updatedData, {
                    where: { idutilizador: id, ativo: true },
                    returning: true,
                });

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

            return res.status(200).json(result);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Error updating User' });
        }
    }

    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
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


controllers.register = async (req, res) => {

    const { nome, email }  = req.body;
    const roles = ['formando'];
    const ativo = false;



    const insertData = {
        nome,
        email,
        ativo
    };


    try {

        const createdRow = await models.utilizadores.create(insertData, {
            returning: true,
        });

        const token = generateAccessToken( 
        {
            idutilizador: createdRow.idutilizador,
            roles : roles 
        })


        const data = {
            to: email,
            subject: 'Confirmação de email',
            text: `Bem vindo á thesoftskills,\n \
                   para finalizar a criação de conta siga \
                   o seguinte link: http://localhost:3001/resetpassword?token=${token}`,
            html: `<h1>Bem vindo á thesoftskills,<h1> \
                   <h2> para finalizar a criação de conta siga \
                   o seguinte <a href="http://localhost:3001/resetpassword?token=${token}">link</a>. <h2>`

        };

        sendEmail(data);


        res.status(200).json({message:"Confirm email"});

    } catch (error) {

        const dbMessage = error?.parent?.message || '';

        if (dbMessage.includes('Utilizador existente')) {
          return res.status(409).json({ error: 'User with that email already exists' });
        }

        console.error('Error creating User:', error);
        return res.status(500).json({ message: 'Error creating User' });
    }
};


controllers.resetPassword = async (req, res) => {

    const id  = req.user.idutilizador;
    const roles = req.user.roles;
    const { password } = req.body;


    const salt = crypto.randomBytes(8).toString('hex');
    const passwordhash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex') ;


    const updateData = {
        salt,
        passwordhash,
        ativo: true
    };
    

    try {

        
        var result = await models.utilizadores.findOne({ where: { idutilizador: id } });

        if (result.dataregisto == null){
            updateData.dataregisto = new Date();
        }


        const [affectedCount, updatedRows] = await models.utilizadores.update(updateData, {
            where: { idutilizador: id },
            returning: true,
        });


        if (affectedCount === 0 ) {
            return res.status(404).json({ message: 'User not found' });
        }


        await updateRoles(id, roles);


        result = await models.utilizadores.findOne({ 
            where: { idutilizador: id } ,
            attributes: ["idutilizador","email","nome","dataregisto","foto","ativo"]
        });

        result.dataValues.roles = await findRoles(id);

        if(result.foto!=null)
            result.dataValues.foto = await generateSASUrl(result.foto, 'userprofiles');

        res.status(200).json(result);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating User' });
    }
};



controllers.create = async (req, res) => {

    const foto = req.file;
    var fotoUrl = null;
    console.log('req.body:', req.body);
    console.log('req.body.info:', req.body.info);
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
    
    if( 
        req.user.idutilizador == id || 
        ( req.user.roles && req.user.roles.map((roleEntry) => roleEntry.role).includes("admin") ) 
    ){

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
    }

    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
};

controllers.activate = async (req, res) => {
    const id = req.params.id;


    if( 
        req.user.idutilizador == id || 
        ( req.user.roles && req.user.roles.map((roleEntry) => roleEntry.role).includes("admin") ) 
    ){

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

    }

    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
};

module.exports = controllers;
