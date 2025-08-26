const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('avaliacaocontinua', {
    idavaliacaocontinua: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
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
    iniciodisponibilidade: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fimdisponibilidade: {
      type: DataTypes.DATE,
      allowNull: true
    },
    iniciodesubmissoes: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fimdesubmissoes: {
      type: DataTypes.DATE,
      allowNull: true
    },
    titulo: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    enunciado: {
      type: DataTypes.STRING(300),
      allowNull: false
    }
  }, {
    tableName: 'avaliacaocontinua',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "avaliacaocontinua_pk",
        unique: true,
        fields: [
          { name: "idavaliacaocontinua" },
          { name: "cursosincrono" },
        ]
      },
    ]
  });
};
