const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('historiconotificacoesprivadas', {
    idnotificacao: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    utilizador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    },
    titulo: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    instante: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'historiconotificacoesprivadas',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "historiconotificacoesprivadas_pk",
        unique: true,
        fields: [
          { name: "idnotificacao" },
        ]
      },
    ]
  });
};
