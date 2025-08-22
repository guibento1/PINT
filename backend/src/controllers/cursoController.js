const Sequelize = require("sequelize");
var initModels = require("../models/init-models.js");
var db = require("../database.js");
var models = initModels(db);
const {
  updateFile,
  deleteFile,
  generateSASUrl,
  isLink,
  sendEmail,
} = require("../utils.js");
const logger = require("../logger.js");

const controllers = {};

async function findTopicos(id) {
  let data = await models.cursotopico.findAll({
    where: {
      curso: id,
    },
    include: [
      {
        model: models.topico,
        as: "topico_topico",
        attributes: ["idtopico", "designacao"],
      },
    ],
  });
  if (data) {
    data = data.map((t) => ({
      idtopico: t.topico_topico.idtopico,
      designacao: t.topico_topico.designacao,
    })); return data;
  }
  return [];
}

async function updateTopicos(id, topicos) {
  try {
    let cursoTopicosInserts = [];
    let existingTopicos = await findTopicos(id);
    existingTopicos = existingTopicos.map((eTopico) => eTopico.idtopico);
    const topicosToDelete = existingTopicos.filter(
      (topico) => !topicos.includes(topico)
    );
    const topicosToInsert = topicos.filter(
      (topico) => !existingTopicos.includes(topico)
    );
    if (topicosToDelete.length > 0) {
      await models.cursotopico.destroy({
        where: {
          topico: {
            [Sequelize.Op.in]: topicosToDelete,
          },
        },
      });
    }
    for (const topico of topicosToInsert) {
      cursoTopicosInserts.push({
        topico: topico,
        curso: id,
      });
    }
    if (cursoTopicosInserts.length > 0) {
      await models.cursotopico.bulkCreate(cursoTopicosInserts);
    }
  } catch (error) {
    console.error("Error in updateTopicos:", error);
    throw error;
  }
}

async function addTipo(cursosIn) {
  if (!(typeof cursosIn[Symbol.iterator] === "function")) cursosIn = [cursosIn];
  const cursosOut = await Promise.all(
    cursosIn.map(async (curso) => {
      const data = await models.cursosincrono.findOne({
        where: {
          curso: curso.idcurso,
        },
      });
      curso.dataValues.sincrono = !!data;
      return curso;
    })
  );
  return cursosOut;
}

async function addInscrito(cursosIn, idFormando) {
  if (!(typeof cursosIn[Symbol.iterator] === "function")) cursosIn = [cursosIn];
  const cursosOut = await Promise.all(
    cursosIn.map(async (curso) => {
      const data = await models.inscricao.findOne({
        where: {
          curso: curso.idcurso,
          formando: idFormando,
        },
      });
      curso.dataValues.inscrito = !!data;
      return curso;
    })
  );
  return cursosOut;
}


async function addLecionado(cursosIn, idFormador) {
  if (!(typeof cursosIn[Symbol.iterator] === "function")) cursosIn = [cursosIn];
  const cursosOut = await Promise.all(
    cursosIn.map(async (curso) => {
      const data = await models.cursosincrono.findOne({
        where: {
          curso: curso.idcurso,
          formador: idFormador,
        },
      });
      curso.dataValues.lecionado = !!data;
      return curso;
    })
  );
  return cursosOut;
}

async function filterCursoResults(roles, cursos) {
  let data;
  const admin = roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;

  const formando =
    roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;

  const formador =
    roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;
  let cursosfiltrados = null;

  if (!admin) {
    let cursosLecionados = [];
    let cursosInscritos = [];
    if (formador) {
      data = await models.cursosincrono.findAll({
        where: {
          formador: formador,
        },
        attributes: ["curso"],
      });
      data.length > 0 ? (data = data.map((c) => c.curso)) : (data = []);
      cursosLecionados = data;
    }
    if (formando) {
      data = await models.inscricao.findAll({
        where: {
          formando: formando,
        },
        attributes: ["curso"],
      });
      data.length > 0 ? (data = data.map((c) => c.curso)) : (data = []);
      cursosInscritos = data;
    }
    cursosfiltrados = cursos.filter(
      (curso) =>
        curso.disponivel ||
        cursosInscritos.includes(curso.idcurso) ||
        cursosLecionados.includes(curso.idcurso)
    );
  }

  if (cursosfiltrados != null) {
    cursosfiltrados = await Promise.all(
      cursosfiltrados.map(async (curso) => {
        if (curso.thumbnail && !isLink(curso.thumbnail)) {
          curso.dataValues.thumbnail = await generateSASUrl(
            curso.thumbnail,
            "thumbnailscursos"
          );
        }
        return curso;
      })
    );
    return cursosfiltrados;
  }

  cursos = await Promise.all(
    cursos.map(async (curso) => {
      if (curso.thumbnail) {
        curso.dataValues.thumbnail = await generateSASUrl(
          curso.thumbnail,
          "thumbnailscursos"
        );
      }
      return curso;
    })
  );
  return cursos;
}

async function filterCursos(
  cursos,
  topicosIn = [],
  areasIn = [],
  categoriasIn = []
) {
  const checkIfcursoInTopicos = async (curso, topicos) => {
    if (!topicos.length) return false;
    const nEntries = await models.cursotopico.count({
      where: {
        curso: curso.idcurso,
        topico: {
          [Sequelize.Op.in]: topicos,
        },
      },
    });
    return nEntries > 0;
  };
  const checkIfcursoInAreas = async (curso, areas) => {
    if (!areas.length) return false;
    const data = await models.topicoarea.findAll({
      where: {
        area: {
          [Sequelize.Op.in]: areas,
        },
      },
    });
    if (!data || !data.length) return false;
    const topicos = data.map((entry) => entry.topico);
    return checkIfcursoInTopicos(curso, topicos);
  };
  const checkIfcursoInCategorias = async (curso, categorias) => {
    if (!categorias.length) return false;
    const data = await models.area.findAll({
      where: {
        categoria: {
          [Sequelize.Op.in]: categorias,
        },
      },
      attributes: ["idarea"],
    });
    if (!data || !data.length) return false;
    const areas = data.map((entry) => entry.idarea);
    return checkIfcursoInAreas(curso, areas);
  };
  const matchedCursos = await Promise.all(
    cursos.map(async (curso) => {
      const match =
        (await checkIfcursoInTopicos(curso, topicosIn)) ||
        (await checkIfcursoInAreas(curso, areasIn)) ||
        (await checkIfcursoInCategorias(curso, categoriasIn));
      return match ? curso : null;
    })
  );
  return matchedCursos.filter(Boolean);
}

async function getCursosByTopicos(topicos) {
  try {
    const data = await models.cursotopico.findAll({
      where: {
        topico: {
          [Sequelize.Op.in]: topicos,
        },
      },
      attributes: ["curso"],
    });
    const cursos =
      data && data.length > 0 ? data.map((entry) => parseInt(entry.curso)) : [];
    return cursos;
  } catch (error) {
    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

async function getCursosByAreas(areas) {
  try {
    const data = await models.topicoarea.findAll({
      where: {
        area: {
          [Sequelize.Op.in]: areas,
        },
      },
      attributes: ["topico"],
    });
    if (data && data.length > 0) {
      const topicos = data.map((entry) => entry.topico);
      const cursos = await getCursosByTopicos(topicos);
      return cursos;
    }
    return [];
  } catch (error) {
    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

async function getCursosByCategorias(categorias) {
  try {
    const data = await models.area.findAll({
      where: {
        categoria: {
          [Sequelize.Op.in]: categorias,
        },
      },
      attributes: ["idarea"],
    });
    if (data.length > 0) {
      const areas = data.map((entry) => entry.idarea);
      const cursos = await getCursosByAreas(areas);
      return cursos;
    }
    return [];
  } catch (error) {
    logger.error(`Erro interno no servidor. Detalhes: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

async function addLicao(idcurso, licao) {
  const createdRow = await models.licao.create(licao, {
    returning: true,
  });
  return createdRow;
}

async function updateLicao(idlicao, params){

  const {titulo,descricao} = params;
  const updateData = {};

  if(titulo == undefined && descricao == undefined) return;
  if(titulo === null || descricao === null) throw new Error("fields must not be null");

  if (titulo != undefined) updateData.titulo = titulo;
  if (descricao != undefined) updateData.descricao = descricao;

  let licao = await models.licao.findOne({where : { idlicao:idlicao }});

  licao = await licao.update(updateData);

  return licao;

}


async function formatSessao(sessao){

  const licao = await models.licao.findByPk(sessao.licao);
  sessao.dataValues.titulo = licao.titulo;
  sessao.dataValues.descricao = licao.descricao;
  sessao.dataValues.curso = licao.curso;

  let materiaisData = await models.licaomaterial.findAll({
    where: { licao: sessao.licao },
    include: [
      {
        model: models.material,
        as: "material_material",
        attributes: ["idmaterial", "titulo", "tipo", "referencia"],
      },
    ],
  });

  const materiais = await Promise.all(
    materiaisData.map(async (entry) => {
      let material = {
        idmaterial: entry.material,
        titulo: entry.material_material.titulo,
        tipo: entry.material_material.tipo,
        referencia: entry.material_material.referencia,
      };

      if (!isLink(material.referencia)) {
        material.referencia = await generateSASUrl(material.referencia, "ficheiroslicao");
      }

      return material;
    })
  );

  sessao.dataValues.materiais = materiais;
  return sessao;
}

async function rmLicao(idlicao) {
  const data = await models.licaomaterial.findAll({
    where: {
      licao: idlicao,
    },
    include: [
      {
        model: models.material,
        as: "material_material",
        attributes: ["idmaterial", "referencia"],
      },
    ],
  });
  const materiais = data.map((entry) => entry.material) || [];
  const referencias =
    data.map((entry) => entry.material_material.referencia) || [];
  for (const referencia of referencias) {
    if (referencia && !isLink(referencia)) {
      try {
        await deleteFile(referencia, "ficheiroslicao");
      } catch (error) {
        logger.warn(
          `Não foi possível apagar o ficheiro da lição. Referência: ${referencia}. Detalhes: ${error.message}`
        );
      }
    }
  }
  await models.licaomaterial.destroy({
    where: {
      licao: idlicao,
    },
  });
  await models.material.destroy({
    where: {
      idmaterial: {
        [Sequelize.Op.in]: materiais,
      },
    },
  });
  await models.licao.destroy({
    where: {
      idlicao: idlicao,
    },
  });
}

async function addLicaoContent(idlicao, ficheiro, material) {

  const licaoExists = await models.licao.findByPk(idlicao);
  if (!licaoExists) {
    throw new Error(`Lição com ID ${idlicao} não existe.`);
  }
  if (material.referencia && ficheiro) {
    throw new Error("Ambigous call, link and file provided");
  }
  if (!material.referencia) {
    material.referencia = await updateFile(ficheiro, "ficheiroslicao");
  }
  const createdMaterial = await models.material.create(material, {
    returning: true,
  });
  await models.licaomaterial.create({
    material: createdMaterial.idmaterial,
    licao: idlicao,
  });
  if (!isLink(createdMaterial.referencia)) {
    createdMaterial.dataValues.referencia = await generateSASUrl(
      createdMaterial.referencia,
      "ficheiroslicao"
    );
  }
  return createdMaterial;
}


async function rmLicaoContent(idlicao, idmaterial) {

  try {

    await models.licaomaterial.destroy({ 

      where : {
       licao: idlicao,
       material: idmaterial,
      }

    });

    const material = await models.material.findByPk(idmaterial);

    if (material.referencia && !isLink(material.referencia)){

      try {
        await deleteFile(material.referencia, "ficheiroslicao");
      } catch (error) {
        logger.warn(
          `Não foi possível apagar o ficheiro da lição na object storage. Referência: ${referencia}. Detalhes: ${error.message}`
        );
      }

    }
    
  } catch (error) {
      logger.warn(
        `Não foi possível apagar o conteudo da lição. Detalhes: ${error.message}`
      );
  }

}

async function createCurso(thumbnail, info) {
  const {
    nome,
    disponivel,
    iniciodeinscricoes,
    fimdeinscricoes,
    planocurricular,
    topicos,
  } = info;
  const insertData = {
    nome,
    disponivel,
    iniciodeinscricoes,
  };
  if (fimdeinscricoes !== undefined)
    insertData.fimdeinscricoes = fimdeinscricoes;
  if (planocurricular !== undefined)
    insertData.planocurricular = planocurricular;
  if (thumbnail) {
    insertData.thumbnail = await updateFile(
      thumbnail,
      "thumbnailscursos",
      null,
      [".jpg", ".png"]
    );
  }
  const createdRow = await models.curso.create(insertData, {
    returning: true,
  });
  if (topicos == undefined || topicos == null || topicos.length == 0) {
    throw new Error("At least one topic must be provided");
  }
  await updateTopicos(createdRow.idcurso, topicos);
  if (createdRow.thumbnail) {
    createdRow.dataValues.thumbnail = await generateSASUrl(
      createdRow.thumbnail,
      "thumbnailscursos"
    );
  }
  createdRow.dataValues.topicos = await findTopicos(createdRow.idcurso);
  return createdRow;
}

async function updateCurso(id, thumbnail, info) {
  const {
    nome,
    disponivel,
    iniciodeinscricoes,
    fimdeinscricoes,
    planocurricular,
    topicos,
  } = info;
  const existingCurso = await models.curso.findByPk(id);
  if (!existingCurso) {
    throw new Error(`Curso with id ${id} not found`);
  }
  const updateData = {};
  if (nome !== undefined) updateData.nome = nome;
  if (disponivel !== undefined) updateData.disponivel = disponivel;
  if (iniciodeinscricoes !== undefined)
    updateData.iniciodeinscricoes = iniciodeinscricoes;
  if (fimdeinscricoes !== undefined)
    updateData.fimdeinscricoes = fimdeinscricoes;
  if (planocurricular !== undefined)
    updateData.planocurricular = planocurricular;
  if (thumbnail) {
    updateData.thumbnail = await updateFile(
      thumbnail,
      "thumbnailscursos",
      existingCurso.thumbnail,
      [".jpg", ".png"]
    );
  }
  await existingCurso.update(updateData);
  if (topicos) {
    if (topicos.length === 0) {
      throw new Error("At least one topic must be provided");
    }
    await updateTopicos(existingCurso.idcurso, topicos);
  }
  if (existingCurso.thumbnail) {
    existingCurso.dataValues.thumbnail = await generateSASUrl(
      existingCurso.thumbnail,
      "thumbnailscursos"
    );
  }
  existingCurso.dataValues.topicos = await findTopicos(existingCurso.idcurso);
  return existingCurso;
}

controllers.list = async (req, res) => {
  logger.debug(
    `Recebida requisição para listar cursos. Query: ${JSON.stringify(
      req.query
    )}`
  );
  let topicos = [];
  let areas = [];
  let categorias = [];
  let filter = [];
  const filterFlag = req.query.area || req.query.categoria || req.query.topico;
  const formando =
    req.user.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;
  const formador =
    req.user.roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;
  const queryOptions = {
    attributes: [
      "idcurso",
      "nome",
      "disponivel",
      "iniciodeinscricoes",
      "fimdeinscricoes",
      "thumbnail",
    ],
  };
  try {
    if (req.query.area) {
      areas = Array.isArray(req.query.area) ? req.query.area : [req.query.area];
      areas = [...new Set(areas)];
      filter.push(...(await getCursosByAreas(areas)));
    }
    if (req.query.categoria) {
      categorias = Array.isArray(req.query.categoria)
        ? req.query.categoria
        : [req.query.categoria];
      categorias = [...new Set(categorias)];
      filter.push(...(await getCursosByCategorias(categorias)));
    }
    if (req.query.topico) {
      topicos = Array.isArray(req.query.topico)
        ? req.query.topico
        : [req.query.topico];
      topicos = [...new Set(topicos)];
      filter.push(...(await getCursosByTopicos(topicos)));
    }
    filter = [...new Set(filter)];
    if (filterFlag) {
      queryOptions.where = {
        idcurso: {
          [Sequelize.Op.in]: filter,
        },
      };
    }
    if (req.query.search) {
      if (!queryOptions.where) queryOptions.where = {};
      queryOptions.where.nome = {
        [Sequelize.Op.iLike]: `%${req.query.search}%`,
      };
    }
    let data = await models.curso.findAll(queryOptions);
    if (!data || data.length === 0) {
      logger.info(`Nenhum curso encontrado com os critérios de pesquisa.`);
      return res.status(200).json([]);
    }
    let cursos = await filterCursoResults(req.user.roles, data);
    cursos = await addTipo(cursos);
    if (req.query.sincrono) {
      cursos = cursos.filter(
        (curso) => curso.dataValues.sincrono == (req.query.sincrono == "true")
      );
    }
    if (formando) cursos = await addInscrito(cursos, formando);

    if (formador) cursos = await addLecionado(cursos, formador);

    logger.info(
      `Lista de cursos retornada com sucesso. Total: ${cursos.length}`
    );
    return res.status(200).json(cursos);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao listar cursos. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao listar os cursos.",
    });
  }
};

controllers.rmCurso = async (req, res) => {

  const { id } = req.params;
  logger.debug(`Recebida requisição para remover curso com ID: ${id}`);
  try {
    const curso = await models.curso.findByPk(id);
    if (!curso) {
      logger.warn(
        `Tentativa de remover curso com ID ${id} que não foi encontrado.`
      );
      return res.status(404).json({
        error: "Curso não encontrado.",
      });
    }
    const cursosincrono = await models.cursosincrono.findOne({
      where: {
        curso: id,
      },
    });

    if (cursosincrono) {

      const sessoes = await models.sessao.findAll({
        where: {
          cursosincrono: cursosincrono.idcursosincrono,
        },
      });

      await Promise.all(
        sessoes.map(async (entry) => {
          await rmLicao(entry.licao);
          await models.sessao.destroy({ where: { idsessao: entry.idsessao } });
        })
      );

      await models.cursosincrono.destroy({where: {curso: id} })

    } else {
      const licoes = await models.licao.findAll({
        where: {
          curso: id,
        },
        attributes: ["idlicao"],
      });

      await Promise.all(
        licoes.map(async (entry) => {
          await rmLicao(entry.idlicao);
        })
      );

      await models.cursoassincrono.destroy({where: {curso: id} })
    }


    await models.cursotopico.destroy({
      where: {
        curso: id,
      },
    });

    await models.curso.destroy({
      where: {
        idcurso: id,
      },
    });

    logger.info(`Curso com ID ${id} removido com sucesso.`);
    return res.status(200).json({
      message: "Curso removido com sucesso.",
    });
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao remover curso. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao remover o curso.",
    });
  }

};

controllers.getCurso = async (req, res) => {
  const { id } = req.params;

  logger.debug(
    `Recebida requisição para buscar detalhes do curso com ID: ${id}`
  );
  let acessible = false;
  const admin =
    req.user.roles.find((roleEntry) => roleEntry.role === "admin")?.id || 0;

  const formando =
    req.user.roles.find((roleEntry) => roleEntry.role === "formando")?.id || 0;

  const formador =
    req.user.roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;

  try {


    if (formando) {
      const inscricao = await models.inscricao.findOne({
        where: {
          curso: id,
          formando: formando,
        },
      });
      if (inscricao) {
        acessible = true;
      }
    }

    if (admin) {
      acessible = true;
    }

    let curso = await models.curso.findOne({
      where: {
        idcurso: id,
      },
      attributes: [
        "idcurso",
        "nome",
        "disponivel",
        "iniciodeinscricoes",
        "fimdeinscricoes",
        "planocurricular",
        "thumbnail",
      ],
    });

    curso = (await addTipo(curso))[0];
    
    if(curso.dataValues.sincrono){
        const cursoSinc = await models.cursosincrono.findOne({
          where: {
            curso: id,
          },
          attributes: ["formador"],
        });

        if(cursoSinc.formador == formador) acessible = true;
    }


    if (!curso || (!curso.disponivel && !acessible)) {
      logger.warn(`Curso com ID ${id} não encontrado ou não acessível.`);
      return res.status(404).json({
        error: "Curso não existente ou não acessível.",
      });
    }
    curso.dataValues.topicos = await findTopicos(id);
    curso = (await addTipo(curso))[0];
    if (curso.thumbnail) {
      curso.dataValues.thumbnail = await generateSASUrl(
        curso.thumbnail,
        "thumbnailscursos"
      );
    }
    if (acessible) {


      logger.debug(`Curso acessivel.`);

      
      if (curso.dataValues.sincrono) {

        logger.debug(`Curso sincrono.`);

        const cursoSincrono = await models.cursosincrono.findOne({
          where: {
            curso: id,
          },
          attributes: ["idcursosincrono","formador","inicio","fim","nhoras","maxincricoes"],
        });

        curso.dataValues.idcrono = cursoSincrono.idcursosincrono;
        curso.dataValues.formador = cursoSincrono.formador;
        curso.dataValues.inicio = cursoSincrono.inicio;
        curso.dataValues.fim = cursoSincrono.fim;
        curso.dataValues.nhoras = cursoSincrono.nhoras;
        curso.dataValues.maxincricoes = cursoSincrono.maxincricoes;

        const sessoes = await models.sessao.findAll({
          where: {
            cursosincrono: curso.dataValues.idcrono,
          },
          attributes: [
            "idsessao",
            "licao",
            "linksessao",
            "datahora",
            "plataformavideoconferencia",
            "duracaohoras",
          ],
        });

        if (sessoes != undefined && sessoes != null && sessoes.length > 0) {
          curso.dataValues.sessoes = await Promise.all(
            sessoes.map(async (sessao) => {
              sessao = await formatSessao(sessao);
              return sessao;
            })
          );
        } else {
          curso.dataValues.sessoes = [];
        }
      } else {
        const cursoAssincrono = await models.cursoassincrono.findOne({
          where: {
            curso: id,
          },
          attributes: ["idcursoassincrono"],
        });
        if (cursoAssincrono) {
          curso.dataValues.idcrono = cursoAssincrono.idcursoassincrono;
        }
        const licoes = await models.licao.findAll({
          where: {
            curso: id,
          },
          attributes: ["idlicao", "titulo", "descricao"],
        });
        if (licoes.length > 0) {
          curso.dataValues.licoes = await Promise.all(
            licoes.map(async (licao) => {
              let materiais = await models.licaomaterial.findAll({
                where: {
                  licao: licao.idlicao,
                },
                attributes: [],
                include: [
                  {
                    model: models.material,
                    as: "material_material",
                    attributes: ["idmaterial", "titulo", "referencia", "tipo"],
                  },
                ],
              });
              if (materiais) {
                materiais = await Promise.all(
                  materiais.map(async (entry) => {
                    let out = entry.material_material;
                    if (!isLink(out.referencia)) {
                      out.dataValues.referencia = await generateSASUrl(
                        out.referencia,
                        "ficheiroslicao"
                      );
                    }
                    return out;
                  })
                );
              }
              licao.dataValues.materiais = materiais;
              return licao;
            })
          );
        } else {
          curso.dataValues.licoes = [];
        }
      }
    }
    curso = (await addTipo(curso))[0];
    if (formando) curso = (await addInscrito(curso, formando))[0];
    logger.info(`Detalhes do curso com ID ${id} retornados com sucesso.`);
    return res.status(200).json(curso);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao buscar curso. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao buscar os detalhes do curso.",
    });
  }
};


controllers.getCursoLecionados = async (req, res) => {

  const { idformador } = req.params;
  logger.debug(
    `Recebida requisição para listar cursos lecionados do formando ${idformador}. Query: ${JSON.stringify(
      req.query
    )}`
  );

  let topicos = [];
  let areas = [];
  let categorias = [];
  let filter = false;
  let cursos;

  const queryOptions = {
    attributes: [
      "idcurso",
      "nome",
      "disponivel",
      "iniciodeinscricoes",
      "fimdeinscricoes",
      "planocurricular",
      "thumbnail",
    ],
    where: {},
  };

  if (req.query.search) {
    queryOptions.where.nome = {
      [Sequelize.Op.iLike]: `%${req.query.search}%`,
    };
  }

  try {
    const cursosLecionados = await models.cursosincrono.findAll({where : { formador : idformador }});
    const cursosIndexes = cursosLecionados.map((cursosinc) => cursosinc.curso);
    queryOptions.where.idcurso = {
      [Sequelize.Op.in]: cursosIndexes,
    };
    cursos = await models.curso.findAll(queryOptions);
    cursos = await Promise.all(
      cursos.map(async (curso) => {
        if (curso.thumbnail) {
          curso.dataValues.thumbnail = await generateSASUrl(
            curso.thumbnail,
            "thumbnailscursos"
          );
          curso.dataValues.sincrono = true;
          curso.dataValues.lecionado = true;
        }
        return curso;
      })
    );
    if (req.query.area) {
      areas = Array.isArray(req.query.area) ? req.query.area : [req.query.area];
      areas = [...new Set(areas)];
      filter = true;
    }
    if (req.query.categoria) {
      categorias = Array.isArray(req.query.categoria)
        ? req.query.categoria
        : [req.query.categoria];
      categorias = [...new Set(categorias)];
      filter = true;
    }
    if (req.query.topico) {
      topicos = Array.isArray(req.query.topico)
        ? req.query.topico
        : [req.query.topico];
      topicos = [...new Set(topicos)];
      filter = true;
    }
    if (filter) {
      cursos = await filterCursos(cursos, topicos, areas, categorias);
    }
    logger.info(
      `Cursos lecionados do formando ${idformador} retornados com sucesso. Total: ${cursos.length}`
    );
    return res.status(200).json(cursos);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao buscar cursos lecionados. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao buscar os cursos lecionados.",
    });
  }
};

controllers.getCursoInscritos = async (req, res) => {
  const { idutilizador } = req.params;
  logger.debug(
    `Recebida requisição para listar cursos inscritos do utilizador ${idutilizador}. Query: ${JSON.stringify(
      req.query
    )}`
  );
  if (
    req.user.idutilizador != idutilizador &&
    !(
      req.user.roles &&
      req.user.roles.map((roleEntry) => roleEntry.role).includes("admin")
    )
  ) {
    logger.warn(
      `Tentativa de acesso não autorizado aos cursos inscritos do utilizador ${idutilizador} pelo utilizador ${req.user.idutilizador}`
    );
    return res.status(403).json({
      error: "Proibido: permissões insuficientes.",
    });
  }
  let topicos = [];
  let areas = [];
  let categorias = [];
  let filter = false;
  let cursos;
  const queryOptions = {
    attributes: [
      "idcurso",
      "nome",
      "disponivel",
      "iniciodeinscricoes",
      "fimdeinscricoes",
      "planocurricular",
      "thumbnail",
    ],
    where: {},
  };
  if (req.query.search) {
    queryOptions.where.nome = {
      [Sequelize.Op.iLike]: `%${req.query.search}%`,
    };
  }
  try {
    const formandoData = await models.formando.findOne({
      where: {
        utilizador: idutilizador,
      },
    });
    if (!formandoData) {
      logger.warn(`Utilizador ${idutilizador} não é um formando.`);
      return res.status(404).json({
        error:
          "Utilizador não tem o papel de formando, nenhum formando foi encontrado com o ID fornecido.",
      });
    }
    const idFormando = formandoData.idformando;
    const inscricoes = await models.inscricao.findAll({
      where: {
        formando: idFormando,
      },
    });
    if (inscricoes.length === 0) {
      logger.info(`Nenhum curso encontrado para o formando ${idFormando}.`);
      return res.status(200).json([]);
    }
    const cursosIndexes = inscricoes.map((inscricao) => inscricao.curso);
    queryOptions.where.idcurso = {
      [Sequelize.Op.in]: cursosIndexes,
    };
    cursos = await models.curso.findAll(queryOptions);
    cursos = await Promise.all(
      cursos.map(async (curso) => {
        if (curso.thumbnail) {
          curso.dataValues.thumbnail = await generateSASUrl(
            curso.thumbnail,
            "thumbnailscursos"
          );
        }
        return curso;
      })
    );
    if (req.query.area) {
      areas = Array.isArray(req.query.area) ? req.query.area : [req.query.area];
      areas = [...new Set(areas)];
      filter = true;
    }
    if (req.query.categoria) {
      categorias = Array.isArray(req.query.categoria)
        ? req.query.categoria
        : [req.query.categoria];
      categorias = [...new Set(categorias)];
      filter = true;
    }
    if (req.query.topico) {
      topicos = Array.isArray(req.query.topico)
        ? req.query.topico
        : [req.query.topico];
      topicos = [...new Set(topicos)];
      filter = true;
    }
    if (filter) {
      cursos = await filterCursos(cursos, topicos, areas, categorias);
    }
    cursos = await addTipo(cursos);
    logger.info(
      `Cursos inscritos para o utilizador ${idutilizador} retornados com sucesso. Total: ${cursos.length}`
    );
    return res.status(200).json(cursos);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao buscar cursos inscritos. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao buscar os cursos inscritos.",
    });
  }
};

controllers.getInscricoes = async (req, res) => {
  const { id } = req.params;
  logger.debug(
    `Recebida requisição para listar inscritos do curso com ID: ${id}`
  );
  try {
    const curso = await models.curso.findByPk(id);
    if (!curso) {
      logger.warn(`Curso com ID ${id} não encontrado.`);
      return res.status(404).json({
        error: "Curso não encontrado.",
      });
    }
    const inscricoes = await models.inscricao.findAll({
      where: {
        curso: id,
      },
      include: [
        {
          model: models.formando,
          as: "formando_formando",
          attributes: ["utilizador"],
        },
      ],
    });
    const utilizadoresIndexes = inscricoes.map(
      (entry) => entry.formando_formando.utilizador
    );
    if (utilizadoresIndexes.length === 0) {
      logger.info(`Nenhum inscrito encontrado para o curso com ID ${id}.`);
      return res.status(200).json([]);
    }
    let utilizadores = await models.utilizadores.findAll({
      attributes: ["idutilizador", "email", "nome"],
      where: {
        idutilizador: {
          [Sequelize.Op.in]: utilizadoresIndexes,
        },
        ativo: true,
      },
    });
    utilizadores = utilizadores.map((utilizador) => {
      const inscricao = inscricoes.find(
        (entry) => entry.formando_formando.utilizador == utilizador.idutilizador
      );
      if (inscricao) {
        utilizador.dataValues.idformando = inscricao.formando;
      }
      return utilizador;
    });
    logger.info(
      `Lista de inscritos para o curso com ID ${id} retornada com sucesso. Total: ${utilizadores.length}`
    );
    return res.status(200).json(utilizadores);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao listar inscritos do curso. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao buscar os inscritos.",
    });
  }
};

controllers.inscreverCurso = async (req, res) => {
  const { id } = req.params;
  const { utilizador: utilizadorIdDoBody } = req.body || {};

  const formador =
    req.user.roles.find((roleEntry) => roleEntry.role === "formador")?.id || 0;

  logger.debug(
    `Recebida requisição para inscrever no curso ${id}. Dados: ${JSON.stringify(
      req.body
    )}`
  );
  const idDoUtilizadorParaInscricao =
    utilizadorIdDoBody || req.user.idutilizador;

  if (
    utilizadorIdDoBody &&
    !req.user.roles?.map((roleEntry) => roleEntry.role).includes("admin") &&
    req.user.idutilizador != utilizadorIdDoBody
  ) {
    logger.warn(
      `Tentativa de inscrição não autorizada de outro utilizador (${utilizadorIdDoBody}) pelo utilizador ${req.user.idutilizador}`
    );
    return res.status(403).json({
      error:
        "Proibido: permissões insuficientes para inscrever outro utilizador.",
    });
  }
  try {
    const formandoData = await models.formando.findOne({
      where: {
        utilizador: idDoUtilizadorParaInscricao,
      },
    });
    if (!formandoData) {
      logger.warn(
        `O utilizador ${idDoUtilizadorParaInscricao} não possui o papel de formando.`
      );
      return res.status(404).json({
        error: "Utilizador não tem o papel de formando.",
      });
    }
    const cursoEncontrado = await models.curso.findByPk(id);
    if (!cursoEncontrado) {
      logger.warn(`Curso com ID ${id} não encontrado.`);
      return res.status(404).json({
        error: "Curso não encontrado.",
      });
    }

    const data = await models.cursosincrono.findOne({
      where:
      { curso : id,
        formador : formador
      }
    });

    if(data){
      logger.warn(
        `O utilizador é formador no curso, não é possivel se inscrever.`
      );
      return res.status(409).json({
        error: "O utilizador é formador no curso, não é possivel se inscrever.",
      });
    }
    const inscricaoExistente = await models.inscricao.findOne({
      where: {
        formando: formandoData.idformando,
        curso: id,
      },
    });
    if (inscricaoExistente) {
      logger.warn(
        `O formando ${formandoData.idformando} já está inscrito no curso ${id}.`
      );
      return res.status(409).json({
        error: "Já se encontra inscrito neste curso.",
      });
    }
    if (!cursoEncontrado.disponivel) {
      logger.warn(`Curso com ID ${id} não está disponível para inscrição.`);
      return res.status(400).json({
        error: "Curso não disponível para inscrição.",
      });
    }

    const cursoSincronoEncontrado = await models.cursosincrono.findOne({where : {curso : id}});

    if(cursoSincronoEncontrado){

      if( cursoSincronoEncontrado.maxinscricoes ) {

        const nInscricoes = await models.inscricao.count({
          where: {
            curso: id,
          },
        });

        if (
          nInscricoes >= cursoEncontrado.maxinscricoes
        ) {
          logger.warn(`Limite máximo de inscrições atingido para o curso ${id}.`);
          return res.status(400).json({
            error: "Vagas esgotadas para este curso.",
          });
        }

      }

    }

    const insertData = {
      formando: formandoData.idformando,
      curso: id,
      registo: new Date(),
    };
    await models.inscricao.create(insertData);
    logger.info(
      `Utilizador ${idDoUtilizadorParaInscricao} inscrito no curso ${id} com sucesso.`
    );
    logger.info(`Email enviado para: ${req.user.email}`);
    await sendEmail({
      to: req.user.email,
      subject: "Inscrição confirmada",
      text: `Você foi inscrito no curso ${cursoEncontrado.nome}.`,
    });
    return res.status(201).json({
      message: "Inscrição realizada com sucesso!",
    });
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao inscrever no curso. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }); return res.status(500).json({ error: "Ocorreu um erro interno ao tentar inscrever no curso.",
    });
  }
};

controllers.sairCurso = async (req, res) => {
  const { id } = req.params;
  const { utilizador: utilizadorIdDoBody } = req.body || {};
  logger.debug(
    `Recebida requisição para desinscrever do curso ${id}. Dados: ${JSON.stringify(
      req.body
    )}`
  );
  const idDoUtilizadorParaDesinscricao =
    utilizadorIdDoBody || req.user.idutilizador;
  if (
    utilizadorIdDoBody &&
    !req.user.roles?.map((roleEntry) => roleEntry.role).includes("admin")
  ) {
    logger.warn(
      `Tentativa de desinscrição não autorizada de outro utilizador (${utilizadorIdDoBody}) pelo utilizador ${req.user.idutilizador}`
    );
    return res.status(403).json({
      error:
        "Proibido: permissões insuficientes para desinscrever outro utilizador.",
    });
  }
  try {
    const formandoData = await models.formando.findOne({
      where: {
        utilizador: idDoUtilizadorParaDesinscricao,
      },
    });
    if (!formandoData) {
      logger.warn(
        `O utilizador ${idDoUtilizadorParaDesinscricao} não possui o papel de formando.`
      );
      return res.status(404).json({
        error: "Utilizador não é um formando ou formando não encontrado.",
      });
    }
    const formando = formandoData.idformando;
    const deletedRows = await models.inscricao.destroy({
      where: {
        formando,
        curso: id,
      },
    });
    if (deletedRows === 0) {
      logger.warn(
        `Inscrição não encontrada para o formando ${formando} no curso ${id}.`
      );
      return res.status(404).json({
        error: "Inscrição não encontrada para este utilizador e curso.",
      });
    }
    logger.info(
      `Inscrição do formando ${formando} no curso ${id} removida com sucesso.`
    );
    return res.status(200).json({
      message: "Inscrição removida com sucesso!",
    });
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao desinscrever do curso. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao tentar sair do curso.",
    });
  }
};

controllers.createCursoAssincrono = async (req, res) => {
  logger.debug(
    `Recebida requisição para criar curso assíncrono. Body: ${req.body.info}`
  );
  const thumbnail = req.file;
  const info = JSON.parse(req.body.info || "{}");
  try {
    const createdRow = await createCurso(thumbnail, info);
    await models.cursoassincrono.create({
      curso: createdRow.idcurso,
    });
    if (createdRow.thumbnail) {
      createdRow.dataValues.thumbnail = await generateSASUrl(
        createdRow.thumbnail,
        "thumbnailscursos"
      );
    }
    createdRow.dataValues.topicos = await findTopicos(createdRow.idcurso);
    logger.info(
      `Curso assíncrono com ID ${createdRow.idcurso} criado com sucesso.`
    );
    return res.status(201).json(createdRow);
  } catch (error) {
    logger.error(`Erro ao criar curso assíncrono. Detalhes: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o curso.",
    });
  }
};

controllers.updateCursoAssincrono = async (req, res) => {
  const { id } = req.params;
  logger.debug(
    `Recebida requisição para atualizar curso assíncrono com ID: ${id}. Body: ${req.body.info}`
  );
  const thumbnail = req.file;
  const info = JSON.parse(req.body.info || "{}");
  try {
    const data = await models.curso.findByPk(id);
    if (!data) {
      logger.warn(
        `Tentativa de atualizar curso assíncrono com ID ${id} que não foi encontrado.`
      );
      return res.status(404).json({
        error: "Curso não encontrado.",
      });
    }
    const updatedCurso = await updateCurso(id, thumbnail, info);
    logger.info(`Curso assíncrono com ID ${id} atualizado com sucesso.`);
    return res.status(200).json(updatedCurso);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao atualizar curso assíncrono. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao atualizar o curso.",
    });
  }
};


controllers.createCursoSincrono = async (req, res) => {
  logger.debug(
    `Recebida requisição para criar curso Síncrono. Body: ${req.body.info}`
  );

  const thumbnail = req.file;
  let info;

  try {
    info = JSON.parse(req.body.info || "{}");
  } catch (parseErr) {
    return res.status(400).json({ error: "JSON inválido no campo 'info'." });
  }

  if (!info.formador) {
    return res.status(400).json({ error: "O campo 'formador' é obrigatório." });
  }

  if (
    info.nhoras === undefined ||
    typeof info.nhoras !== 'number' ||
    info.nhoras <= 0
  ) {
    return res.status(400).json({ error: "O campo 'nhoras' é obrigatório e deve ser um número positivo." });
  }

  if (!info.inicio || isNaN(new Date(info.inicio))) {
    return res.status(400).json({ error: "O campo 'inicio' é obrigatório e deve ser uma data válida." });
  }

  if (!info.fim || isNaN(new Date(info.fim))) {
    return res.status(400).json({ error: "O campo 'fim' é obrigatório e deve ser uma data válida." });
  }

  if (new Date(info.inicio) >= new Date(info.fim)) {
    return res.status(400).json({ error: "O campo 'fim' deve ser posterior ao campo 'inicio'." });
  }

  try {
    const createdRow = await createCurso(thumbnail, info);

    await models.cursosincrono.create({
      curso: createdRow.idcurso,
      formador: info.formador,
      nhoras: info.nhoras,
      inicio: info.inicio,
      fim: info.fim,
      maxinscricoes: info.maxinscricoes !== undefined ? info.maxinscricoes : null,
    });

    if (createdRow.thumbnail) {
      createdRow.dataValues.thumbnail = await generateSASUrl(
        createdRow.thumbnail,
        "thumbnailscursos"
      );
    }

    createdRow.dataValues.topicos = await findTopicos(createdRow.idcurso);
    createdRow.dataValues.formador = info.formador;
    createdRow.dataValues.nHoras = info.nhoras;
    createdRow.dataValues.inicio = info.inicio;
    createdRow.dataValues.fim = info.fim;
    createdRow.dataValues.maxinscricoes= info.maxinscricoes !== undefined ? info.maxinscricoes : null;

    logger.info(`Curso Síncrono com ID ${createdRow.idcurso} criado com sucesso.`);

    return res.status(201).json(createdRow);
  } catch (error) {
    logger.error(`Erro ao criar curso síncrono. Detalhes: ${error.message}`, {
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o curso.",
    });
  }
};


controllers.updateCursoSincrono = async (req, res) => {

  const { id } = req.params;
  logger.debug(
    `Recebida requisição para atualizar curso síncrono com ID: ${id}. Body: ${req.body.info}`
  );

  const thumbnail = req.file;
  const info = JSON.parse(req.body.info || "{}");

  try {
    const data = await models.curso.findByPk(id);
    if (!data) {
      logger.warn(`Tentativa de atualizar curso síncrono com ID ${id} que não foi encontrado.`);
      return res.status(404).json({ error: "Curso não encontrado." });
    }

    const updatedCurso = await updateCurso(id, thumbnail, info);

    const invalidFields = ["inicio", "fim", "formador", "nhoras"].filter(
      (field) => field in info && info[field] === null
    );

    if (invalidFields.length > 0) {
      logger.info(`Validação de argumentos para o update do curso sincrono falhou.`);
      return res.status(400).json({
        error: `Os seguintes campos não podem ser nulos se forem enviados: ${invalidFields.join(", ")}`,
      });
    }

    const updateData = {};

    if (info.maxinscricoes !== undefined) updateData.maxincricoes = info.maxinscricoes;
    if (info.inicio !== undefined) updateData.inicio = info.inicio;
    if (info.fim !== undefined) updateData.fim = info.fim;
    if (info.formador !== undefined) updateData.formador = info.formador;
    if (info.nhoras !== undefined) updateData.nhoras = info.nhoras;

    let cursoSincrono = await models.cursosincrono.findOne({ where: { curso: id } });

    cursoSincrono = await cursoSincrono.update(updateData);

    updatedCurso.dataValues.formador = cursoSincrono.formador;
    updatedCurso.dataValues.nHoras = cursoSincrono.nhoras;
    updatedCurso.dataValues.inicio = cursoSincrono.inicio;
    updatedCurso.dataValues.fim = cursoSincrono.fim;
    updatedCurso.dataValues.maxinscricoes = cursoSincrono.maxincricoes;

    logger.info(`Curso síncrono com ID ${id} atualizado com sucesso.`);
    return res.status(200).json(updatedCurso);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao atualizar curso síncrono. Detalhes: ${error.message}`,
      { stack: error.stack }
    );
    return res.status(500).json({ error: "Ocorreu um erro interno ao atualizar o curso." });
  }
};


controllers.addSessao = async (req, res) => {

  const { idcursosinc } = req.params;
  const { 

      titulo, 
      descricao, 
      linksessao, 
      datahora, 
      duracaohoras, 
      plataformavideoconferencia 

  } = req.body;


  logger.debug(
    `Recebida requisição para adicionar lição ao curso síncrono ${idcursosinc}. Dados: ${JSON.stringify(
      req.body
    )}`
  );

  if (!titulo || !descricao || !linksessao || !datahora || !duracaohoras || !plataformavideoconferencia ) {
    logger.warn(
      `Tentativa de adicionar sessao com campos faltando. Dados recebidos: ${JSON.stringify(
        req.body
      )}`
    );
    return res.status(400).json({
      error: 'Os campos "titulo", "descricao", "linkSessão", "dataHora", "duracaoHoras", "plataformaVideoConferencia" são obrigatórios.',
    });
  }

  try {

    const cursosinc = await models.cursosincrono.findOne({
      where: {
        idcursosincrono: idcursosinc,
      },
      attributes: ["curso"],
    });
    if (!cursosinc) {
      logger.warn(`Curso síncrono com ID ${idcursosinc} não encontrado.`);
      return res.status(404).json({
        error: "Curso assíncrono não encontrado.",
      });
    }

    const licao = {
      curso: cursosinc.curso,
      titulo,
      descricao,
    };

    let createdRow = await addLicao(cursosinc.curso, licao);

    logger.info(
      `Lição com ID ${createdRow.idsessao} creada com sucesso.`
    );

    insertData = {
      licao : createdRow.idlicao,
      cursosincrono : idcursosinc,
      linksessao,
      datahora, 
      duracaohoras, 
      plataformavideoconferencia 
    }

    createdRow = await models.sessao.create(insertData, {
      returning: true,
    });


    logger.info(
      `Sessão com ID ${createdRow.idsessao} adicionada com sucesso ao curso síncrono ${idcursosinc}.`
    );

    const result = await formatSessao(createdRow);

    return res.status(201).json(result);
    
  } catch (error) {

    logger.error(
      `Erro interno do servidor ao adicionar sessão. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno.",
    });
    
  }

};


controllers.rmSessao = async (req, res) => {

  const { idsessao } = req.params;
  logger.debug(`Recebida requisição para remover sessão com ID: ${idsessao}`);
  try {
    const sessao = await models.sessao.findByPk(idsessao);
    if (!sessao) {
      logger.warn(
        `Tentativa de remover sessão com ID ${idsessao} que não foi encontrada.`
      );
      return res.status(404).json({
        error: "Sessão não encontrada.",
      });
    }

    const idlicao = sessao.licao;
    await sessao.destroy();

    await rmLicao(idlicao);
    logger.debug(`Lição associada a sessão eleminada com sucesso.`);


    return res.status(201).json({
      message: "Sessão removida com sucesso.",
    });
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao remover sessão. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao remover a sessão.",
    });
  }
};


controllers.updateSessao = async (req, res) => {

  const { idsessao } = req.params;
  const { 

      titulo, 
      descricao, 
      linksessao, 
      datahora, 
      duracaohoras, 
      plataformavideoconferencia 

  } = req.body;

  logger.debug(`Recebida requisição para atualizar sessão com ID: ${idsessao}`);
  try {

    let sessao = await models.licao.findByPk(idsessao);
    let updateData = {};

    sessao = await sessao.update({linksessao,datahora,duracaohoras,plataformavideoconferencia});
    await updateLicao(sessao.licao,{titulo,descricao})

    const result = await formatSessao(sessao);
    return res.status(201).json(result);

  } catch (error) {
    logger.error(
      `Erro interno do servidor ao atualizar sessão. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao atualizar a sessão.",
    });
  }

};


controllers.addSessaoContent = async (req, res) => {

  const { idsessao } = req.params;
  const sessao = await models.sessao.findByPk(idsessao);
  const idlicao = sessao.licao;

  logger.debug(
    `Recebida requisição para adicionar material à sessão ${idsessao}. Body: ${req.body.info}`
  );
  const ficheiro = req.file;
  const { titulo, tipo, link } = JSON.parse(req.body.info || "{}");
  if (!titulo || !tipo || (!ficheiro && !link)) {
    logger.warn(
      `Tentativa de adicionar material com campos faltando. Dados: ${req.body.info}`
    );
    return res.status(400).json({
      error:
        'Os campos "titulo", "tipo" e um "link" ou "ficheiro" são obrigatórios.',
    });
  }
  const material = {
    titulo,
    tipo,
    referencia: link,
    criador: req.user.idutilizador,
  };
  try {

    const createdMaterial = await addLicaoContent(idlicao, ficheiro, material);
    logger.info(
      `Material com ID ${createdMaterial.idmaterial} adicionado com sucesso à sessão ${idsessao}.`
    );
    return res.status(201).json(createdMaterial);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao adicionar material à sessão. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o material.",
    });
  }

};


controllers.rmSessaoContent = async (req, res) => {

  const { idsessao, idmaterial } = req.params;
  const sessao = await models.sessao.findByPk(idsessao);
  const idlicao = sessao.licao;

  logger.debug(
    `Recebida requisição para remover material à sessão ${idlicao}.`
  );

  if (!idlicao || !idmaterial) {
    logger.warn(
      `Tentativa de remover material com campos faltando.`
    );
    return res.status(400).json({
      error:
        'Os campos "idlicao" e "idmaterial" são obrigatórios.',
    });
  }

  try {

    await rmLicaoContent(idlicao, idmaterial);

    logger.info(
      `Conteudo da sessão ${idsessao} e id ${idmaterial} removido com sucesso`
    );

    return res.status(201).json({message:"material removido com sucesso"});
    
  } catch (error) {

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o material.",
    });
    
  }

};

//TODO


controllers.addAvaliacaoContinua = async (req, res) => {

  const { idcursosinc } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};

controllers.rmAvaliacaoContinua = async (req, res) => {

  const { idcursosinc, idavalicaocontinua } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};


controllers.editAvaliacaoContinua = async (req, res) => {

  const { idcursosinc, idavalicaocontinua } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};


controllers.addAvaliacaoFinal = async (req, res) => {

  const { idcursosinc, formando } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};


controllers.editAvaliacaoFinal = async (req, res) => {

  const { idcursosinc, formando } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};




controllers.rmAvaliacaoFinal = async (req, res) => {

  const { idcursosinc, formando } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};


controllers.addSubmissao = async (req, res) => {

  const { idcursosinc, idavalicao  } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};


controllers.updateSubmissao = async (req, res) => {

  const { idcursosinc, idavalicao  } = req.params;


  logger.debug(
    `Recebida requisição para adicionar um avaliação continua ao curso sincrono ${idcursosinc}.`
  );

  try {

    
  } catch (error) {

    
  }

};


controllers.addLicao = async (req, res) => {
  const { idcursoassinc } = req.params;
  const { titulo, descricao } = req.body;
  logger.debug(
    `Recebida requisição para adicionar lição ao curso assíncrono ${idcursoassinc}. Dados: ${JSON.stringify(
      req.body
    )}`
  );
  if (!titulo || !descricao) {
    logger.warn(
      `Tentativa de adicionar lição com campos faltando. Dados recebidos: ${JSON.stringify(
        req.body
      )}`
    );
    return res.status(400).json({
      error: 'Os campos "titulo" e "descricao" são obrigatórios.',
    });
  }
  try {
    const cursoassinc = await models.cursoassincrono.findOne({
      where: {
        idcursoassincrono: idcursoassinc,
      },
      attributes: ["curso"],
    });
    if (!cursoassinc) {
      logger.warn(`Curso assíncrono com ID ${idcursoassinc} não encontrado.`);
      return res.status(404).json({
        error: "Curso assíncrono não encontrado.",
      });
    }
    const licao = {
      curso: cursoassinc.curso,
      titulo,
      descricao,
    };
    const createdRow = await addLicao(cursoassinc.curso, licao);
    logger.info(
      `Lição com ID ${createdRow.idlicao} adicionada com sucesso ao curso assíncrono ${idcursoassinc}.`
    );
    return res.status(201).json(createdRow);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao adicionar lição. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar a lição.",
    });
  }
};

controllers.rmLicao = async (req, res) => {

  const { idlicao } = req.params;
  logger.debug(`Recebida requisição para remover lição com ID: ${idlicao}`);
  try {
    const licao = await models.licao.findByPk(idlicao);
    if (!licao) {
      logger.warn(
        `Tentativa de remover lição com ID ${idlicao} que não foi encontrada.`
      );
      return res.status(404).json({
        error: "Lição não encontrada.",
      });
    }
    await rmLicao(idlicao);
    logger.info(`Lição com ID ${idlicao} removida com sucesso.`);
    return res.status(200).json({
      message: "Lição removida com sucesso.",
    });
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao remover lição. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao remover a lição.",
    });
  }
};


controllers.updateLicao = async (req, res) => {
  const { idlicao } = req.params;
  const { titulo, descricao } = req.body;
  logger.debug(`Recebida requisição para atualizar lição com ID: ${idlicao}`);
  try {
    let licao = await models.licao.findByPk(idlicao);
    if (!licao) {
      logger.warn(
        `Tentativa de atualizar lição com ID ${idlicao} que não foi encontrada.`
      );
      return res.status(404).json({
        error: "Lição não encontrada.",
      });
    }
    licao = await updateLicao(idlicao, {titulo,descricao});
    logger.info(`Lição com ID ${idlicao} atualizada com sucesso.`);
    return res.status(200).json(licao);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao atualizar lição. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao atualizar a lição.",
    });
  }
};

controllers.addLicaoContent = async (req, res) => {

  const { idlicao } = req.params;
  logger.debug(
    `Recebida requisição para adicionar material à lição ${idlicao}. Body: ${req.body.info}`
  );
  const ficheiro = req.file;
  const { titulo, tipo, link } = JSON.parse(req.body.info || "{}");
  if (!titulo || !tipo || (!ficheiro && !link)) {
    logger.warn(
      `Tentativa de adicionar material com campos faltando. Dados: ${req.body.info}`
    );
    return res.status(400).json({
      error:
        'Os campos "titulo", "tipo" e um "link" ou "ficheiro" são obrigatórios.',
    });
  }
  const material = {
    titulo,
    tipo,
    referencia: link,
    criador: req.user.idutilizador,
  };
  try {
    const createdMaterial = await addLicaoContent(idlicao, ficheiro, material);
    logger.info(
      `Material com ID ${createdMaterial.idmaterial} adicionado com sucesso à lição ${idlicao}.`
    );
    return res.status(201).json(createdMaterial);
  } catch (error) {
    logger.error(
      `Erro interno do servidor ao adicionar material à lição. Detalhes: ${error.message}`,
      {
        stack: error.stack,
      }
    );
    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o material.",
    });
  }
};


controllers.rmLicaoContent = async (req, res) => {

  const { idlicao, idmaterial } = req.params;
  logger.debug(
    `Recebida requisição para remover material à lição ${idlicao}.`
  );

  if (!idlicao || !idmaterial) {
    logger.warn(
      `Tentativa de remover material com campos faltando.`
    );
    return res.status(400).json({
      error:
        'Os campos "idlicao" e "idmaterial" são obrigatórios.',
    });
  }

  try {

    await rmLicaoContent(idlicao, idmaterial);

    logger.info(
      `Conteudo da licao ${idlicao} e id ${idmaterial} removido com sucesso`
    );

    return res.status(201).json({message:"material removido com sucesso"});
    
  } catch (error) {

    return res.status(500).json({
      error: "Ocorreu um erro interno ao criar o material.",
    });
    
  }

};

module.exports = controllers;
