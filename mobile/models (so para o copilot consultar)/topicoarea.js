const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('topicoarea', {
    topico: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'topico',
        key: 'idtopico'
      }
    },
    area: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'area',
        key: 'idarea'
      }
    }
  }, {
    tableName: 'topicoarea',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "topicoarea_pk",
        unique: true,
        fields: [
          { name: "topico" },
          { name: "area" },
        ]
      },
    ]
  });
};
