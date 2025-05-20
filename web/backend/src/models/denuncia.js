const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('denuncia', {
    iddenuncia: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tipodenuncia',
        key: 'idtipodenuncia'
      }
    },
    descricao: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    criador: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    }
  }, {
    tableName: 'denuncia',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "denuncia_pk",
        unique: true,
        fields: [
          { name: "iddenuncia" },
        ]
      },
    ]
  });
};
