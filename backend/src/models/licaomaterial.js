const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('licaomaterial', {
    material: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'material',
        key: 'idmaterial'
      }
    },
    licao: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'licao',
        key: 'idlicao'
      }
    },
    curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'licao',
        key: 'idlicao'
      }
    }
  }, {
    tableName: 'licaomaterial',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "licaomaterial_pk",
        unique: true,
        fields: [
          { name: "material" },
          { name: "licao" },
          { name: "curso" },
        ]
      },
    ]
  });
};
