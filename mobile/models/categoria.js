const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('categoria', {
    idcategoria: {
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
    tableName: 'categoria',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "categoria_pk",
        unique: true,
        fields: [
          { name: "idcategoria" },
        ]
      },
    ]
  });
};
