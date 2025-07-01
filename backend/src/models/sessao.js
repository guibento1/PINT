const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sessao', {
    idsessao: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: "sessao_idsessao_key"
    },
    licao: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'licao',
        key: 'idlicao'
      }
    },
    cursosincrono: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'cursosincrono',
        key: 'idcursosincrono'
      }
    },
    linksessao: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    datahora: {
      type: DataTypes.DATE,
      allowNull: false
    },
    plataformavideoconferencia: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    duracaohoras: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    tableName: 'sessao',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sessao_idsessao_key",
        unique: true,
        fields: [
          { name: "idsessao" },
        ]
      },
      {
        name: "sessao_pk",
        unique: true,
        fields: [
          { name: "licao" },
          { name: "cursosincrono" },
        ]
      },
    ]
  });
};
