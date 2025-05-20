const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('submissao', {
    idsubmissao: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    avaliacaocontinua: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'avaliacaocontinua',
        key: 'idavaliacaocontinua'
      }
    },
    cursosincrono: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'avaliacaocontinua',
        key: 'idavaliacaocontinua'
      }
    },
    formando: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'formando',
        key: 'idformando'
      }
    },
    submissao: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'material',
        key: 'idmaterial'
      }
    },
    nota: {
      type: DataTypes.DOUBLE,
      allowNull: true
    }
  }, {
    tableName: 'submissao',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "submissao_pk",
        unique: true,
        fields: [
          { name: "idsubmissao" },
          { name: "avaliacaocontinua" },
          { name: "cursosincrono" },
        ]
      },
    ]
  });
};
