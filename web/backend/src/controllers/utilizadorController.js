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
        const data = await models.utilizadores.findOne({ where: { email } });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!data.ativo) {
            return res.status(403).json({ error: 'User disabled' });
        }

        data.dataValues.roles = await findRoles(data.idutilizador);
        res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.byID = async (req, res) => {
    const id = req.params.id;

    try {
        const data = await models.utilizadores.findOne({ where: { idutilizador: id } });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!data.ativo) {
            return res.status(403).json({ error: 'User disabled' });
        }

        data.dataValues.roles = await findRoles(id);
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

controllers.update = async (req, res) => {
    const { id } = req.params;
    const { nome, email, passwordhash, morada, telefone, foto, roles } = req.body;

    const updatedData = {};
    if (nome) updatedData.nome = nome;
    if (email) updatedData.email = email;
    if (passwordhash) updatedData.passwordhash = passwordhash;
    if (morada !== undefined) updatedData.morada = morada;
    if (telefone !== undefined) updatedData.telefone = telefone;
    if (foto !== undefined) updatedData.foto = foto;

    try {

        const [affectedCount, updatedRows] = await models.utilizadores.update(updatedData, {
            where: { idutilizador: id, ativo: true },
            returning: true,
        });

        if ((affectedCount === 0 || updatedRows.length === 0) && roles == undefined ) {
            return res.status(404).json({ message: 'User not found or inactive' });
        }

        if (roles !== undefined) {
            await updateRoles(id, roles);
        }

        const result = await models.utilizadores.findOne({ where: { idutilizador: id } });
        result.dataValues.roles = await findRoles(id);

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating User' });
    }
};


controllers.list = async (req,res) => {

    try {
        const data = await models.utilizadores.findAll();
        res.status(200).json(data);
            
    } catch (error) {
        return res.status(400).json({ error: 'Something bad happened' });
    }
};

controllers.create = async (req, res) => {
    const { nome, email, salt, passwordhash, morada, telefone, foto, roles } = req.body;

    const insertData = {
        nome,
        email,
        salt,
        passwordhash,
        dataregisto: new Date(),
    };

    if (morada !== undefined) insertData.morada = morada;
    if (telefone !== undefined) insertData.telefone = telefone;
    if (foto !== undefined) insertData.foto = foto;

    try {
        const createdRow = await models.utilizadores.create(insertData, {
            returning: true,
        });

        if (roles !== undefined) {
            await updateRoles(createdRow.idutilizador, roles);
        }

        createdRow.dataValues.roles = await findRoles(createdRow.idutilizador);
        res.status(201).json(createdRow);

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
    const { passwordhash } = req.body;

    if (passwordhash == null) {
        return res.status(400).json({ error: 'Missing passwordhash' });
    }

    try {
        const data = await models.utilizadores.findOne({ where: { idutilizador: id } });

        if (!data) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (data.passwordhash === passwordhash) {
            await models.utilizadores.update({ ativo: true }, { where: { idutilizador: id } });
            return res.status(200).json({ message: 'User activated' });
        }

        return res.status(403).json({ error: 'Password mismatch' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Something bad happened' });
    }
};

module.exports = controllers;
