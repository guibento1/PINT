const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('topico', {
    idtopico: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    designacao: {
      type: DataTypes.STRING(60),
      allowNull: false
    }
  }, {
    tableName: 'topico',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "topico_pk",
        unique: true,
        fields: [
          { name: "idtopico" },
        ]
      },
    ]
  });
};
