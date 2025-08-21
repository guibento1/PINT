const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sessao', {
    idsessao: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    licao: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'licao',
        key: 'idlicao'
      },
      unique: "licao_curso_u"
    },
    cursosincrono: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'cursosincrono',
        key: 'idcursosincrono'
      },
      unique: "licao_curso_u"
    },
    linksessao: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    datahora: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duracaohoras: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 1
    },
    plataformavideoconferencia: {
      type: DataTypes.STRING(60),
      allowNull: true
    }
  }, {
    tableName: 'sessao',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "licao_curso_u",
        unique: true,
        fields: [
          { name: "licao" },
          { name: "cursosincrono" },
        ]
      },
      {
        name: "sessao_pk",
        unique: true,
        fields: [
          { name: "idsessao" },
        ]
      },
    ]
  });
};
