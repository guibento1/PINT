const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('canaisutilizadores', {
    canal: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
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
    tableName: 'canaisutilizadores',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "canaisutilizadores_pk",
        unique: true,
        fields: [
          { name: "canal" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
