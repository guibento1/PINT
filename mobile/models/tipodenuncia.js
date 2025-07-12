const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tipodenuncia', {
    idtipodenuncia: {
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
    tableName: 'tipodenuncia',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tipodenuncia_pk",
        unique: true,
        fields: [
          { name: "idtipodenuncia" },
        ]
      },
    ]
  });
};
