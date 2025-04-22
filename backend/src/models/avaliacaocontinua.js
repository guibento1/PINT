const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('avaliacaocontinua', {
    idavaliacaocontinua: {
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
    enunciado: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'material',
        key: 'idmaterial'
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
    limitesubmissoes: {
      type: DataTypes.INTEGER,
      allowNull: true
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
