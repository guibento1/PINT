const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notificacao', {
    idnotificacao: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    conteudo: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    instante: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'notificacao',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "notificacao_pk",
        unique: true,
        fields: [
          { name: "idnotificacao" },
        ]
      },
    ]
  });
};
