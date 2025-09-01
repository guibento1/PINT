const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('topicossubscritosutilizadores', {
    topico: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'topico',
        key: 'idtopico'
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
    tableName: 'topicossubscritosutilizadores',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "topicossubscritosutilizadores_pk",
        unique: true,
        fields: [
          { name: "topico" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
