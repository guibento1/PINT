const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('historiconotificacoes', {
    idnotificacao: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    canal: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'canalnotificacoes',
        key: 'idcanalnotificacoes'
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
    tableName: 'historiconotificacoes',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "historiconotificacoes_pk",
        unique: true,
        fields: [
          { name: "idnotificacao" },
        ]
      },
    ]
  });
};
