const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('area', {
    idarea: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    categoria: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'categoria',
        key: 'idcategoria'
      }
    },
    designacao: {
      type: DataTypes.STRING(60),
      allowNull: false
    }
  }, {
    tableName: 'area',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "area_pk",
        unique: true,
        fields: [
          { name: "idarea" },
        ]
      },
    ]
  });
};
