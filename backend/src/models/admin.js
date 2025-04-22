const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('admin', {
    idadmin: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: "admin_idadmin_key"
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
    tableName: 'admin',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "admin_idadmin_key",
        unique: true,
        fields: [
          { name: "idadmin" },
        ]
      },
      {
        name: "admin_pk",
        unique: true,
        fields: [
          { name: "idadmin" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
