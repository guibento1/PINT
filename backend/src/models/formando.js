const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('formando', {
    idformando: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: "formando_idformando_key"
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
    tableName: 'formando',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "formando_idformando_key",
        unique: true,
        fields: [
          { name: "idformando" },
        ]
      },
      {
        name: "formando_pk",
        unique: true,
        fields: [
          { name: "idformando" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
