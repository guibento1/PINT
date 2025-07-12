const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notificacaogeral', {
    idnotificacao: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'notificacao',
        key: 'idnotificacao'
      }
    },
    canal: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'canalnotificacoes',
        key: 'idcanalnotificacoes'
      }
    }
  }, {
    tableName: 'notificacaogeral',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "notificaogeral_pk",
        unique: true,
        fields: [
          { name: "idnotificacao" },
          { name: "canal" },
        ]
      },
    ]
  });
};
