const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('utilizadordispositivos', {
    utilizador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    },
    dispositivo: {
      type: DataTypes.STRING(300),
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'utilizadordispositivos',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "utilizadordispositivos_pk",
        unique: true,
        fields: [
          { name: "utilizador" },
          { name: "dispositivo" },
        ]
      },
    ]
  });
};
