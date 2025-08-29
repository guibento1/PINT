const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('iteracaopost', {
    post: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'post',
        key: 'idpost'
      }
    },
    utilizador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    },
    positiva: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    tableName: 'iteracaopost',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "post_iteracao_pk",
        unique: true,
        fields: [
          { name: "post" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
