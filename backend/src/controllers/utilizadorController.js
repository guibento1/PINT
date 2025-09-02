const { uploadFile, deleteFile, updateFile, generateSASUrl, sendEmail, isLink } = require('../utils');
const { generateAccessToken } = require('../middleware');
const crypto = require('crypto');
const Sequelize = require('sequelize');
const logger = require('../logger.js');

var initModels = require("../models/init-models");
var db = require("../database");
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

            if (hasRole) {
                await models[role].upsert({
                    utilizador: id,
                    ativo: true
                }, {
                    where: { utilizador: id }
                });
            }
            
            if (!hasRole && currentlyHas) {
                await models[role].update({ ativo: false }, {
                    where: { utilizador: id }
                });
            }
        }
    } catch (error) {
        throw error;
    }
}

const controllers = {};

controllers.getByEmail = async (req, res) => {

    const { email } = req.query; 

    logger.debug(`Requisição para procurar utilizador por email recebida: ${email || 'não fornecido'}.`);

    if (!email) {
        logger.warn('Tentativa de procurar utilizador sem fornecer email. Requisição inválida.');
        return res.status(400).json({
            error: 'O email é obrigatório.'
        });
    }

    try {
        const data = await models.utilizadores.findOne({
            where: { email },
            attributes: ["idutilizador", "email", "nome", "dataregisto", "foto", "ativo"]
        });

        if (!data) {
            logger.info(`Tentativa de acesso a utilizador não encontrado para o email: ${email}.`);
            return res.status(404).json({
                error: 'Utilizador não encontrado.'
            });
        }

        if (!data.ativo) {
            logger.warn(`Tentativa de acesso a utilizador inativo: ${email}.`, { idutilizador: data.idutilizador });
            return res.status(403).json({
                error: 'O utilizador está desativado.'
            });
        }

        logger.debug(`A obter funções para o utilizador ${data.idutilizador} (${email}).`);
        data.dataValues.roles = await findRoles(data.idutilizador);
        logger.debug(`Funções obtidas para o utilizador ${data.idutilizador}: ${data.dataValues.roles.join(', ')}`);


        if (data.dataValues.foto) {
            data.dataValues.foto = await generateSASUrl(data.dataValues.foto, 'userprofiles');
        } else {
            data.dataValues.foto = null;
        }


        logger.info(`Utilizador ${data.idutilizador} (${email}) acedido com sucesso.`);
        res.status(200).json(data);

    } catch (error) {
        logger.error(`Erro interno ao procurar utilizador por email: ${email}. Detalhes: ${error.message}`, {
            email,
            stack: error.stack,
            method: 'controllers.utilizadores.byEmail',
            query: req.query 
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno no servidor.'
        });
    }
};


controllers.getAdmin = async (req, res) => {

    const { id } = req.query; 

    logger.debug(`Requisição para procurar admin'}.`);

    try {
        const idutilizador = await models.admin.findOne({
            where : { idadmin : id, ativo : true }
        })?.utilizador;

        if(idutilizador && idutilizador != undefined){

            const utilizador = await models.utilizadores.findByPk(idutilizador,{
                attributes: ["email", "nome", "foto"]
            });

            if (utilizador.dataValues.foto) 
                utilizador.dataValues.foto = await generateSASUrl(utilizador.dataValues.foto, 'userprofiles');

            return res.status(200).json(utilizador);

        } else {

            logger.info(`Tentativa de acesso a admin não encontrado para o id: ${id}.`);
            return res.status(404).json({
                error: 'Utilizador não encontrado.'
            });

        }

    } catch (error) {
        logger.error(`Erro interno ao procurar admin. Detalhes: ${error.message}`, {
            email,
            stack: error.stack,
            method: 'controllers.utilizadores.getAdmin',
            query: req.query 
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno no servidor.'
        });
    }
};


controllers.getFormador = async (req, res) => {

    const { id } = req.query; 

    logger.debug(`Requisição para procurar formador'}.`);

    try {
        const idutilizador = await models.formador.findOne({
            where : { idformador : id, ativo : true }
        })?.utilizador;

        if(idutilizador && idutilizador != undefined){

            const utilizador = await models.utilizadores.findByPk(idutilizador,{
                attributes: ["email", "nome", "foto"]
            });

            if (utilizador.dataValues.foto) 
                utilizador.dataValues.foto = await generateSASUrl(utilizador.dataValues.foto, 'userprofiles');

            return res.status(200).json(utilizador);

        } else {

            logger.info(`Tentativa de acesso a formador não encontrado para o id: ${id}.`);
            return res.status(404).json({
                error: 'Utilizador não encontrado.'
            });

        }

    } catch (error) {
        logger.error(`Erro interno ao procurar admin. Detalhes: ${error.message}`, {
            email,
            stack: error.stack,
            method: 'controllers.utilizadores.getFormador',
            query: req.query 
        });
        return res.status(500).json({
            error: 'Ocorreu um erro interno no servidor.'
        });
    }
};


controllers.loginUser = async (req, res) => {
  const { email, password } = req.body;

  logger.debug(`Tentativa de login para o email: ${email || 'não fornecido'}.`);

  if (!email) {
    logger.warn('Tentativa de login sem fornecer email. Requisição inválida.');
    return res.status(400).json({ error: 'O email é obrigatório.' });
  }

  try {
    const data = await models.utilizadores.findOne({
      where: { email },
      attributes: ['idutilizador','email','nome','dataregisto','foto','ativo','passwordhash','salt']
    });

    if (!data) {
      logger.info(`Tentativa de login falhada: Utilizador não encontrado para o email: ${email}.`);
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    if (!data.ativo) {
      if (data.passwordhash === null) {
        logger.warn(`Tentativa de login de utilizador com email não confirmado: ${email}.`, { idutilizador: data.idutilizador });
        return res.status(403).json({ error: 'Por favor, confirme o seu email para ativar a conta.' });
      } else {
        logger.warn(`Tentativa de login de utilizador desativado: ${email}.`, { idutilizador: data.idutilizador });
        return res.status(403).json({ error: 'A sua conta está desativada. Por favor, contacte o suporte.' });
      }
    }

    if (!password) {
      logger.warn(`Tentativa de login para ${email} sem fornecer password.`);
      return res.status(400).json({ error: 'A password é obrigatória.' });
    }

    logger.debug(`A verificar password para o utilizador ${email}.`);
    const passwordhash = crypto.pbkdf2Sync(password, data.salt, 1000, 64, 'sha512').toString('hex');

    if (passwordhash !== data.passwordhash) {
      logger.info(`Tentativa de login falhada: Password incorreta para o email: ${email}.`);
      return res.status(401).json({ error: 'Password incorreta.' });
    }

    logger.info(`Login bem-sucedido para o utilizador ${data.idutilizador} (${email}).`);

    logger.debug(`A obter funções para o utilizador ${data.idutilizador}.`);
    data.dataValues.roles = await findRoles(data.idutilizador);
    if (!data.dataValues.roles || data.dataValues.roles.length === 0) {
      logger.error(`Utilizador ${data.idutilizador} (${email}) sem funções atribuídas após login bem-sucedido.`);
      return res.status(500).json({ error: 'Erro: O utilizador não tem funções atribuídas.' });
    }

    if (data.foto) {
      data.dataValues.foto = await generateSASUrl(data.foto, 'userprofiles');
    } else {
      data.dataValues.foto = null;
    }

    const accessToken = generateAccessToken({
      idutilizador: data.idutilizador,
      roles: data.dataValues.roles,
      email: data.email
    });
    logger.debug(`Access Token gerado para o utilizador ${data.idutilizador}, ${accessToken}.`);

    const responseData = {
      idutilizador: data.idutilizador,
      email: data.email,
      nome: data.nome,
      dataregisto: data.dataregisto,
      ativo: data.ativo,
      foto: data.dataValues.foto,
      roles: data.dataValues.roles,
      accessToken
    };

    return res.status(200).json(responseData);
  } catch (error) {
    logger.error(`Erro interno no servidor durante o processo de login para o email: ${email}. Detalhes: ${error.message}`, {
      email,
      stack: error.stack,
      method: 'controllers.loginUser',
      requestBody: req.body
    });
    return res.status(500).json({ error: 'Ocorreu um erro interno no servidor durante o login.' });
  }
};


controllers.byID = async (req, res) => {

    const { id } = req.params;
    const isAdmin = req.user.roles?.some(role => role.role === "admin");
    const isSelf = req.user.idutilizador == id;

    logger.debug(`Pedido de dados do utilizador ID ${id} por utilizador autenticado ID ${req.user.idutilizador}.`);

    if (!isSelf && !isAdmin) {
        logger.warn(`Acesso negado: utilizador ${req.user.idutilizador} tentou aceder aos dados do utilizador ${id} sem permissões suficientes.`);
        return res.status(403).json({ message: 'Acesso negado: sem permissões suficientes' });
    }

    try {
        logger.debug(`A procurar utilizador com ID ${id}.`);
        const data = await models.utilizadores.findByPk(id, {
            attributes: ["idutilizador", "email", "nome", "morada", "telefone", "dataregisto", "foto", "ativo"]
        });

        if (!data) {
            logger.info(`Utilizador com ID ${id} não encontrado.`);
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        if (!data.ativo) {
            logger.warn(`Utilizador com ID ${id} está desativado. Acesso negado.`);
            return res.status(403).json({ error: 'Utilizador desativo' });
        }

        logger.debug(`A obter funções e foto para o utilizador ${id}.`);
        const roles = await findRoles(id);
        const foto = data.foto ? await generateSASUrl(data.foto, 'userprofiles') : null;

        logger.info(`Dados do utilizador ${id} obtidos com sucesso por ${req.user.idutilizador}.`);
        return res.status(200).json({
            ...data.dataValues,
            roles,
            foto
        });

    } catch (error) {
        logger.error(`Erro ao obter dados do utilizador ${id}.`, {
            requesterId: req.user.idutilizador,
            targetId: id,
            stack: error.stack,
            method: 'controllers.byID'
        });
        return res.status(500).json({ error: 'Ocorreu um erro interno no servidor' });
    }
};

controllers.update = async (req, res) => {

    const { id } = req.params;
    const isAdmin = req.user.roles?.some(role => role.role === "admin");
    const isSelf = req.user.idutilizador == id;

    logger.debug(`Pedido de atualização de dados para o utilizador ${id} por ${req.user.idutilizador}.`);

    if (!isSelf && !isAdmin) {
        logger.warn(`Acesso negado: utilizador ${req.user.idutilizador} tentou atualizar os dados do utilizador ${id} sem permissões suficientes.`);
        return res.status(403).json({ message: 'Acesso negado: sem permissões suficientes' });
    }

    const foto = req.file;
    const updatedData = {};
    const { nome, email, password, morada, telefone, roles } = JSON.parse(req.body.info || "{}");

    if (nome) updatedData.nome = nome;
    if (email) updatedData.email = email;
    if (morada !== undefined) updatedData.morada = morada;
    if (telefone !== undefined) updatedData.telefone = telefone;

    try {
        logger.debug(`A procurar utilizador com ID ${id}.`);
        let result = await models.utilizadores.findByPk(id);

        if (!result) {
            logger.info(`Utilizador com ID ${id} não encontrado ou inativo.`);
            return res.status(404).json({ message: 'Utilizador não encontrado ou desativo' });
        }

        if (password) {
            const passwordhash = crypto.pbkdf2Sync(password, result.salt, 1000, 64, 'sha512').toString('hex');
            updatedData.passwordhash = passwordhash;
            logger.debug(`Password atualizada para o utilizador ${id}.`);
        }

        if (foto) {
            updatedData.foto = await updateFile(foto, "userprofiles", result.foto, [".jpg", ".png"]);
            logger.debug(`Foto atualizada para o utilizador ${id}.`);
        }

        if (Object.keys(updatedData).length > 0) {
            const [affectedCount] = await models.utilizadores.update(updatedData, {
                where: { idutilizador: id, ativo: true },
                returning: true,
            });

            if (affectedCount === 0) {
                logger.info(`Nenhuma atualização feita para o utilizador ${id}.`);
                return res.status(404).json({ message: 'Utilizador não encontrado ou desativo' });
            }
            logger.info(`Dados do utilizador ${id} atualizados com sucesso.`);
        }

        if (roles && isAdmin) {
            await updateRoles(id, roles);
            logger.info(`Funções atualizadas para o utilizador ${id}.`);
        }

        result = await models.utilizadores.findByPk(id, {
            attributes: ["idutilizador", "email", "nome", "morada", "telefone", "dataregisto", "foto", "ativo"]
        });

        result.dataValues.roles = await findRoles(id);
        if (result.foto) {
            result.dataValues.foto = await generateSASUrl(result.foto, 'userprofiles');
        }

        logger.info(`Dados do utilizador ${id} retornados com sucesso após atualização.`);
        return res.status(200).json(result);
    } catch (error) {
        logger.error(`Erro ao atualizar dados do utilizador ${id}.`, {
            requesterId: req.user.idutilizador,
            targetId: id,
            stack: error.stack,
            method: 'controllers.update'
        });
        return res.status(500).json({ message: 'Erro ao atualizar dados do utilizador' });
    }
};


controllers.list = async (req, res) => {

    const id = req.user.idutilizador;

    logger.debug(`Pedido para listar utilizadores, excluindo o utilizador ID ${id}.`);

    try {
        const data = await models.utilizadores.findAll({
            attributes: ["idutilizador", "email", "nome", "dataregisto", "foto", "ativo"],
            where: {
                idutilizador: {
                    [Sequelize.Op.ne]: id
                }
            },
            order : [["idutilizador", "ASC"]]
        });

        if (!data.length) {
            logger.info(`Nenhum utilizador encontrado além do utilizador ID ${id}.`);
            return res.status(404).json({ message: 'Nenhum utilizador encontrado' });
        }

        for (let user of data) {
            user.dataValues.roles = await findRoles(user.idutilizador);
            user.dataValues.foto = user.dataValues.foto ? await generateSASUrl(user.dataValues.foto, 'userprofiles') : null;
        }

        logger.info(`Lista de utilizadores excluindo o utilizador ID ${id} retornada com sucesso.`);
        return res.status(200).json(data);

    } catch (error) {
        logger.error(`Erro ao listar utilizadores.`, {
            requesterId: id,
            stack: error.stack,
            method: 'controllers.list'
        });
        return res.status(500).json({ error: 'Erro ao listar utilizadores' });
    }
};


controllers.register = async (req, res) => {

    const { nome, email } = req.body;
    const roles = ['formando'];
    const ativo = false;

    const insertData = { nome, email, ativo };

    logger.debug(`Tentativa de registo de utilizador com email ${email}.`);

    try {
        const createdRow = await models.utilizadores.create(insertData, {
            returning: true,
        });

        const token = generateAccessToken({
            idutilizador: createdRow.idutilizador,
            roles,
            email
        });

        const emailData = {
            to: email,
            subject: 'Confirmação de email',
            text: `Bem vindo à thesoftskills,\n \
                   para finalizar a criação de conta siga \
                   o seguinte link: http://localhost:3001/resetpassword?token=${token}`,
            html: `<h1>Bem vindo à thesoftskills,<h1> \
                   <h2> para finalizar a criação de conta siga \
                   o seguinte <a href="http://localhost:3001/resetpassword?token=${token}">link</a>.</h2>`
        };

        sendEmail(emailData);
        logger.info(`Email de confirmação enviado para ${email}.`);

        return res.status(200).json({ message: "Confirm email" });

    } catch (error) {
        const dbMessage = error?.parent?.message || '';
        
        if (dbMessage.includes('Utilizador existente')) {
            logger.warn(`Tentativa de registo falhada: utilizador com email ${email} já existe.`);
            return res.status(409).json({ error: `Tentativa de registo falhada: utilizador com email ${email} já existe.` });
        }

        logger.error(`Erro ao criar utilizador com email ${email}.`, {
            error: error.message,
            stack: error.stack,
            method: 'controllers.register'
        });

        return res.status(500).json({ message: 'Erro ao criar utilizador' });
    }
};


controllers.resetPassword = async (req, res) => {

    const id = req.user.idutilizador;
    const roles = req.user.roles;
    const { password } = req.body;

    logger.debug(`Tentativa de reset de password para o utilizador ID ${id}.`);

    const salt = crypto.randomBytes(8).toString('hex');
    const passwordhash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const updateData = {
        salt,
        passwordhash,
        ativo: true
    };

    try {
        logger.debug(`A procurar utilizador com ID ${id}.`);
        let result = await models.utilizadores.findByPk(id);

        if (!result) {
            logger.warn(`Utilizador com ID ${id} não encontrado.`);
            return res.status(404).json({ message: 'Utilizador não econtrado' });
        }

        if (result.dataregisto == null) {
            updateData.dataregisto = new Date();
        }

        logger.debug(`A atualizar dados do utilizador ID ${id}.`);
        const [affectedCount] = await models.utilizadores.update(updateData, {
            where: { idutilizador: id },
            returning: true,
        });

        if (affectedCount === 0) {
            logger.warn(`Nenhuma atualização feita para o utilizador ID ${id}.`);
            return res.status(404).json({ message: 'Utilizador não econtrado' });
        }

        logger.debug(`Funções do utilizador ID ${id} a serem atualizadas.`);
        await updateRoles(id, roles);

        result = await models.utilizadores.findByPk(id,{
            attributes: ["idutilizador", "email", "nome", "dataregisto", "foto", "ativo"]
        });

        result.dataValues.roles = await findRoles(id);

        if (result.foto) {
            result.dataValues.foto = await generateSASUrl(result.foto, 'userprofiles');
        }

        logger.info(`Password e dados do utilizador ID ${id} atualizados com sucesso.`);
        return res.status(200).json(result);

    } catch (error) {
        logger.error(`Erro ao tentar resetar password para o utilizador ID ${id}.`, {
            error: error.message,
            stack: error.stack,
            method: 'controllers.resetPassword'
        });
        return res.status(500).json({ message: 'Erro ao fazer reset á password' });
    }
};



controllers.create = async (req, res) => {
    const foto = req.file;
    let fotoUrl = null;

    logger.debug(`Tentativa de registo de novo utilizador com email ${req.body.email}.`);

    const { nome, email, password, morada, telefone, roles } = JSON.parse(req.body.info);
    const salt = crypto.randomBytes(8).toString('hex');
    const passwordhash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

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
        if (foto) {
            insertData.foto = await updateFoto(foto);
            fotoUrl = await generateSASUrl(insertData.foto, 'userprofiles');
        }

        const createdRow = await models.utilizadores.create(insertData, { returning: true });

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

        logger.info(`Novo utilizador criado com sucesso: ID ${createdRow.idutilizador}`);
        return res.status(201).json(responseData);

    } catch (error) {
        const dbMessage = error?.parent?.message || '';

        if (dbMessage.includes('Utilizador existente')) {
            logger.warn(`Tentativa de registo falhada: utilizador com email ${email} já existe.`);
            return res.status(409).json({ error: `Tentativa de registo falhada: utilizador com email ${email} já existe.` });
        }

        logger.error(`Erro ao criar utilizador com email ${email}.`, {
            error: error.message,
            stack: error.stack,
            method: 'controllers.create'
        });

        return res.status(500).json({ message: 'Error creating User' });
    }
};

controllers.delete = async (req, res) => {
    const id = req.params.id;

    logger.debug(`Tentativa de desativação do utilizador ID ${id}.`);

    if (req.user.idutilizador == id || (req.user.roles && req.user.roles.some(role => role.role === "admin"))) {
        try {
            const user = await models.utilizadores.findByPk(id);

            if (!user || !user.ativo) {
                logger.warn(`Utilizador ID ${id} não encontrado ou já desativado.`);
                return res.status(404).json({ message: `Utilizador ID ${id} não encontrado ou já desativado.` });
            }

            await models.utilizadores.destroy({ where: { idutilizador: id } });

            if(user.foto){


                try {
                  await deleteFile(user.foto, "userprofiles");
                } catch (error) {
                  logger.error(
                    `Imagem de perfil do utilizador com ID ${id} não removida.. Detalhes: ${error.message}`,
                    {
                      stack: error.stack,
                    }
                  );
                }


            }





            logger.info(`Utilizador ID ${id} desativado com sucesso.`);
            return res.status(200).json({ message: 'Utilizador desativado' });

        } catch (error) {
            logger.error(`Erro ao desativar o utilizador ID ${id}.`, {
                error: error.message,
                stack: error.stack,
                method: 'controllers.delete'
            });
            return res.status(500).json({ error: 'Erro ao desativar o utilizador' });
        }
    }

    logger.warn(`Utilizador ID ${id} não tem permissões para desativar ou não é um administrador.`);
    return res.status(403).json({ message: 'Utilizador não tem permissões para desativar' });
};

controllers.activate = async (req, res) => {
    const id = req.params.id;

    logger.debug(`Tentativa de ativação do utilizador ID ${id}.`);

    if (req.user.idutilizador == id || (req.user.roles && req.user.roles.some(role => role.role === "admin"))) {
        try {
            const data = await models.utilizadores.findByPk(id);

            if (!data) {
                logger.warn(`Utilizador ID ${id} não encontrado.`);
                return res.status(404).json({ error: `Utilizador ID ${id} não encontrado.` });
            }

            await models.utilizadores.update({ ativo: true }, { where: { idutilizador: id } });
            logger.info(`Utilizador ID ${id} ativado com sucesso.`);
            return res.status(200).json({ message: `Utilizador ativado com sucesso.` });

        } catch (error) {
            logger.error(`Erro ao ativar o utilizador ID ${id}.`, {
                error: error.message,
                stack: error.stack,
                method: 'controllers.activate'
            });
            return res.status(500).json({ error: 'Erro ao ativar o utilizador' });
        }
    }

    logger.warn(`Utilizador ID ${id} não tem permissões para ativar ou não é um administrador.`);
    return res.status(403).json({ message: 'Utilizador não tem permissões para ativar outro utilizador' });
};

module.exports = controllers;
