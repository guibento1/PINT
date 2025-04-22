const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notificacaopessoal', {
    idnotificacao: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'notificacao',
        key: 'idnotificacao'
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
    }
  }, {
    tableName: 'notificacaopessoal',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "notificacaopessoal_pk",
        unique: true,
        fields: [
          { name: "idnotificacao" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
