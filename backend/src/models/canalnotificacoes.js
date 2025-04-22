const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('canalnotificacoes', {
    idcanalnotificacoes: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.STRING(300),
      allowNull: true
    }
  }, {
    tableName: 'canalnotificacoes',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "canalnotificacoes_pk",
        unique: true,
        fields: [
          { name: "idcanalnotificacoes" },
        ]
      },
    ]
  });
};
